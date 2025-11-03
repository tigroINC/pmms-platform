import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      },
    });

    // 고유한 itemKey 추출
    const uniqueItemKeys = [...new Set(measurements.map((m) => m.itemKey))];

    // 2. 굴뚝별 측정항목 설정 조회
    const stackMeasurementItems = await prisma.stackMeasurementItem.findMany({
      where: { stackId },
      include: {
        item: true,
      },
    });

    // StackMeasurementItem에 있는 항목 키 추출
    const configuredItemKeys = stackMeasurementItems.map((smi) => smi.itemKey);

    // 측정 이력 + 설정된 항목 모두 포함
    const allItemKeys = [...new Set([...uniqueItemKeys, ...configuredItemKeys])];

    // 항목 정보 조회 (오염물질 + 보조항목)
    const items = await prisma.item.findMany({
      where: {
        key: { in: allItemKeys },
        category: { in: ["오염물질", "보조항목"] },
      },
    });

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
    const resultItems = items.map((item) => ({
      key: item.key,
      name: item.name,
      unit: item.unit,
      category: item.category,
      limit: item.limit,
      measurementCount: countMap.get(item.key) || 0,
      isActive: configMap.get(item.key)?.isActive ?? true, // 기본값 true
      order: configMap.get(item.key)?.order ?? item.order ?? 0, // StackMeasurementItem order 우선, 없으면 Item order
    }));

    // 정렬 함수: order가 0이 아닌 항목 우선, 같은 order는 name으로 정렬
    const sortByOrder = (a: any, b: any) => {
      if (a.order === 0 && b.order !== 0) return 1;
      if (a.order !== 0 && b.order === 0) return -1;
      if (a.order === b.order) return a.name.localeCompare(b.name);
      return a.order - b.order;
    };

    // 오염물질과 보조항목 분리
    const pollutants = resultItems.filter(item => item.category === "오염물질");
    const auxiliary = resultItems.filter(item => item.category === "보조항목");
    
    // 각각 정렬
    pollutants.sort(sortByOrder);
    auxiliary.sort(sortByOrder);
    
    // 오염물질 먼저, 보조항목 나중에
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
