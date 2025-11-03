import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 배출허용기준 조회
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const stackId = searchParams.get("stackId");
    const itemKey = searchParams.get("itemKey");
    const organizationId = searchParams.get("organizationId");
    
    const userRole = (session.user as any).role;
    const userOrgId = (session.user as any).organizationId;

    // 필터 조건 구성
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (stackId) where.stackId = stackId;
    if (itemKey) where.itemKey = itemKey;

    // 조직 필터링: customerId가 있는 경우만 (전체 기준은 조직 무관)
    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { organizationId: true },
      });

      if (customer) {
        // SUPER_ADMIN: organizationId로 필터링
        if (userRole === "SUPER_ADMIN") {
          if (organizationId && customer.organizationId !== organizationId) {
            // 다른 조직의 고객사는 접근 불가
            return NextResponse.json({ data: [] });
          }
        } else {
          // 일반 사용자: 자신의 조직만
          if (customer.organizationId !== userOrgId) {
            return NextResponse.json({ data: [] });
          }
        }
      }
    }

    // @ts-ignore
    const limits = await prisma.emissionLimit.findMany({
      where,
      orderBy: [
        { itemKey: "asc" },
        { stackId: "desc" }, // 굴뚝별이 우선
        { customerId: "desc" }, // 고객사별이 다음
      ],
    });

    return NextResponse.json({ data: limits });
  } catch (error: any) {
    console.error("Error fetching emission limits:", error);
    return NextResponse.json(
      { error: error.message || "배출허용기준 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 배출허용기준 저장/수정
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { limits, customerId, stackId, region, createdBy } = body;

    if (!Array.isArray(limits) || limits.length === 0) {
      return NextResponse.json(
        { error: "저장할 기준 데이터가 없습니다." },
        { status: 400 }
      );
    }

    // undefined/null을 빈 문자열로 변환 (Prisma unique 제약조건 대응)
    const customerIdValue = customerId || "";
    const stackIdValue = stackId || "";
    const regionValue = region || null;
    const createdByValue = createdBy || null;

    console.log("API 저장 처리:", {
      customerIdValue,
      stackIdValue,
      regionValue,
      limitsCount: limits.length,
    });

    // 트랜잭션으로 일괄 저장/수정
    const results = await prisma.$transaction(
      limits.map((item: { itemKey: string; limit: number }) =>
        // @ts-ignore
        prisma.emissionLimit.upsert({
          where: {
            itemKey_customerId_stackId: {
              itemKey: item.itemKey,
              customerId: customerIdValue,
              stackId: stackIdValue,
            },
          },
          update: {
            limit: item.limit,
            region: regionValue,
            createdBy: createdByValue,
            updatedAt: new Date(),
          },
          create: {
            itemKey: item.itemKey,
            limit: item.limit,
            region: regionValue,
            customerId: customerIdValue,
            stackId: stackIdValue,
            createdBy: createdByValue,
          },
        })
      )
    );

    return NextResponse.json({
      message: `${results.length}개 항목의 기준이 저장되었습니다.`,
      data: results,
    });
  } catch (error: any) {
    console.error("Error saving emission limits:", error);
    return NextResponse.json(
      { error: error.message || "배출허용기준 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 배출허용기준 삭제
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const customerId = searchParams.get("customerId");
    const stackId = searchParams.get("stackId");
    const itemKey = searchParams.get("itemKey");

    if (id) {
      // 특정 ID 삭제
      // @ts-ignore
      await prisma.emissionLimit.delete({
        where: { id },
      });
      return NextResponse.json({ message: "기준이 삭제되었습니다." });
    } else if (itemKey && (customerId || stackId)) {
      // 조건으로 삭제
      // @ts-ignore
      await prisma.emissionLimit.delete({
        where: {
          itemKey_customerId_stackId: {
            itemKey,
            customerId: customerId || "",
            stackId: stackId || "",
          },
        },
      });
      return NextResponse.json({ message: "기준이 삭제되었습니다." });
    } else {
      return NextResponse.json(
        { error: "삭제할 기준을 특정할 수 없습니다." },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error deleting emission limit:", error);
    return NextResponse.json(
      { error: error.message || "배출허용기준 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
