import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FIELD_TO_ITEM_KEY } from "@/lib/itemKeyMapping";

// 굴뚝별 측정항목 조회
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const stackId = params.id;

    // 굴뚝 정보 확인
    const stack = await prisma.stack.findUnique({
      where: { id: stackId },
      include: { customer: true },
    });

    if (!stack) {
      return NextResponse.json({ error: "굴뚝을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    const userRole = (session.user as any).role;
    const userCustomerId = (session.user as any).customerId;
    const userOrgId = (session.user as any).organizationId;

    const isCustomerUser = userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER";
    const isSuperAdmin = userRole === "SUPER_ADMIN";

    if (isCustomerUser && stack.customerId !== userCustomerId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 1. 해당 굴뚝의 측정 이력에서 사용된 항목 조회
    const measurements = await prisma.measurement.findMany({
      where: {
        stackId,
      },
      select: {
        itemKey: true,
        weather: true,
        temperatureC: true,
        humidityPct: true,
        pressureMmHg: true,
        windDirection: true,
        windSpeedMs: true,
        gasVelocityMs: true,
        gasTempC: true,
        moisturePct: true,
        oxygenMeasuredPct: true,
        oxygenStdPct: true,
        flowSm3Min: true,
      },
    });

    // 고유한 itemKey 추출 (오염물질)
    const uniqueItemKeys = [...new Set(measurements.map((m) => m.itemKey))];
    
    // 실제 데이터가 있는 채취환경 항목만 추출
    const auxiliaryKeys = new Set<string>();
    measurements.forEach((m) => {
      Object.entries(FIELD_TO_ITEM_KEY).forEach(([field, itemKey]) => {
        if (m[field as keyof typeof m] !== null && m[field as keyof typeof m] !== undefined) {
          auxiliaryKeys.add(itemKey);
        }
      });
    });
    
    // 오염물질 + 채취환경 항목 합치기
    const allMeasurementKeys = [...new Set([...uniqueItemKeys, ...Array.from(auxiliaryKeys)])];
    console.log(`[GET /api/stacks/${stackId}/measurement-items] 측정 이력 항목:`, allMeasurementKeys);

    // 2. 굴뚝별 측정항목 설정 조회
    const stackMeasurementItems = await prisma.stackMeasurementItem.findMany({
      where: { stackId },
      include: {
        item: true,
      },
    });

    // StackMeasurementItem에 있는 항목 키 추출
    const configuredItemKeys = stackMeasurementItems.map((smi) => smi.itemKey);
    console.log(`[GET /api/stacks/${stackId}/measurement-items] 설정된 항목:`, configuredItemKeys);

    // 측정 이력 + 설정된 항목 모두 포함
    const allItemKeys = [...new Set([...allMeasurementKeys, ...configuredItemKeys])];
    console.log(`[GET /api/stacks/${stackId}/measurement-items] 전체 항목 키:`, allItemKeys);

    // 항목 정보 조회 (모든 카테고리 포함)
    const items = await prisma.item.findMany({
      where: {
        key: { in: allItemKeys },
      },
    });
    console.log(`[GET /api/stacks/${stackId}/measurement-items] 조회된 항목:`, items.map(i => ({ key: i.key, name: i.name, category: i.category })));

    // 측정 횟수 계산
    const measurementCounts = await prisma.measurement.groupBy({
      by: ["itemKey"],
      where: {
        stackId,
        itemKey: { in: items.map((i) => i.key) },
      },
      _count: {
        id: true,
      },
    });

    const countMap = new Map(
      measurementCounts.map((c) => [c.itemKey, c._count.id])
    );

    const configMap = new Map(
      stackMeasurementItems.map((smi) => [
        smi.itemKey,
        { isActive: smi.isActive, order: smi.order },
      ])
    );

    // 3. 결과 조합
    const resultItems = items.map((item) => {
      const stackConfig = configMap.get(item.key);
      const stackOrder = stackConfig?.order;
      const itemOrder = item.order ?? 0;
      // stackOrder가 없거나 0이면 itemOrder 사용
      const finalOrder = (stackOrder && stackOrder !== 0) ? stackOrder : itemOrder;
      
      console.log(`[${item.name}] stackOrder: ${stackOrder}, itemOrder: ${itemOrder}, finalOrder: ${finalOrder}`);
      
      return {
        key: item.key,
        name: item.name,
        unit: item.unit,
        category: item.category,
        limit: item.limit,
        measurementCount: countMap.get(item.key) || 0,
        isActive: stackConfig?.isActive ?? true, // 기본값 true
        order: finalOrder, // StackMeasurementItem order 우선, 없으면 Item order
        inputType: item.inputType,
        options: item.options,
      };
    });

    // 정렬 함수: order가 0이 아닌 항목 우선, 같은 order는 name으로 정렬
    const sortByOrder = (a: any, b: any) => {
      if (a.order === 0 && b.order !== 0) return 1;
      if (a.order !== 0 && b.order === 0) return -1;
      if (a.order === b.order) return a.name.localeCompare(b.name);
      return a.order - b.order;
    };

    // 오염물질과 채취환경 분리 (보조항목도 채취환경으로 처리)
    const pollutants = resultItems.filter(item => item.category === "오염물질");
    const auxiliary = resultItems.filter(item => item.category === "채취환경" || item.category === "보조항목");
    
    // 각각 정렬
    pollutants.sort(sortByOrder);
    auxiliary.sort(sortByOrder);
    
    // 오염물질 먼저, 채취환경 나중에
    const sortedItems = [...pollutants, ...auxiliary];

    return NextResponse.json({ items: sortedItems });
  } catch (error: any) {
    console.error("Get stack measurement items error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      stackId: params.id,
    });
    return NextResponse.json(
      { 
        error: "측정항목 조회 중 오류가 발생했습니다.",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// 굴뚝별 측정항목 설정 업데이트
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const stackId = params.id;
    const body = await request.json();
    const { items } = body; // [{ itemKey, isActive, order }]

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "items 배열이 필요합니다." },
        { status: 400 }
      );
    }

    // 굴뚝 정보 확인
    const stack = await prisma.stack.findUnique({
      where: { id: stackId },
    });

    if (!stack) {
      return NextResponse.json({ error: "굴뚝을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    const userRole = (session.user as any).role;
    const userCustomerId = (session.user as any).customerId;

    const isCustomerUser = userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER";
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const isOrgAdmin = userRole === "ORG_ADMIN" || userRole === "OPERATOR";

    if (isCustomerUser && stack.customerId !== userCustomerId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    if (!isSuperAdmin && !isOrgAdmin && !isCustomerUser) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 트랜잭션으로 업데이트
    await prisma.$transaction(
      items.map((item) =>
        prisma.stackMeasurementItem.upsert({
          where: {
            stackId_itemKey: {
              stackId,
              itemKey: item.itemKey,
            },
          },
          create: {
            stackId,
            itemKey: item.itemKey,
            isActive: item.isActive ?? true,
            order: item.order ?? 0,
          },
          update: {
            isActive: item.isActive ?? true,
            order: item.order ?? 0,
          },
        })
      )
    );

    return NextResponse.json({ ok: true, message: "설정이 저장되었습니다." });
  } catch (error) {
    console.error("Update stack measurement items error:", error);
    return NextResponse.json(
      { error: "설정 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 굴뚝별 측정항목 설정 초기화 (전체 기준으로 되돌리기)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const stackId = params.id;

    // 굴뚝 정보 확인
    const stack = await prisma.stack.findUnique({
      where: { id: stackId },
    });

    if (!stack) {
      return NextResponse.json({ error: "굴뚝을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    const userRole = (session.user as any).role;
    const userCustomerId = (session.user as any).customerId;

    const isCustomerUser = userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER";
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const isOrgAdmin = userRole === "ORG_ADMIN" || userRole === "OPERATOR";

    if (isCustomerUser && stack.customerId !== userCustomerId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    if (!isSuperAdmin && !isOrgAdmin && !isCustomerUser) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 해당 굴뚝의 모든 StackMeasurementItem 삭제
    await prisma.stackMeasurementItem.deleteMany({
      where: { stackId },
    });

    return NextResponse.json({ ok: true, message: "전체 기준으로 초기화되었습니다." });
  } catch (error) {
    console.error("Delete stack measurement items error:", error);
    return NextResponse.json(
      { error: "초기화 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
