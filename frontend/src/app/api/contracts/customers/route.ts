import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 조직의 모든 고객사 + 계약 정보 조회
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const organizationId = (session.user as any).organizationId;

    // 권한 체크
    if (userRole !== "SUPER_ADMIN" && userRole !== "ORG_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    if (!organizationId) {
      return NextResponse.json({ error: "조직 정보가 없습니다." }, { status: 400 });
    }

    // 조직의 모든 고객사 조회 (고객사관리 전체탭 기준)
    console.log("[Contracts API] Fetching customers for org:", organizationId);
    
    // 조직 사용자 목록 조회
    const orgUsers = await prisma.user.findMany({
      where: { organizationId },
      select: { id: true }
    });
    const orgUserIds = orgUsers.map(u => u.id);
    
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          // 조직 사용자가 등록한 고객사
          { createdBy: { in: orgUserIds } },
          // 연결된 고객사 (상태 무관)
          {
            organizations: {
              some: {
                organizationId,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        code: true,
        businessNumber: true,
      },
    });
    
    console.log("[Contracts API] Found customers:", customers.length);

    const customerIds = customers.map(c => c.id);

    // 계약 정보 조회
    const contracts = await prisma.contract.findMany({
      where: {
        organizationId,
        customerId: { in: customerIds },
      },
    });

    // 고객사별 계약 매핑
    const now = new Date();
    const customersWithContracts = customers.map(customer => {
      const contract = contracts.find(c => c.customerId === customer.id);
      
      let daysRemaining = null;
      let status = null;
      
      if (contract) {
        const endDate = new Date(contract.endDate);
        const diffTime = endDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (daysRemaining < 0) {
          status = "EXPIRED";
        } else if (daysRemaining <= 28) {
          status = "EXPIRING";
        } else {
          status = "ACTIVE";
        }
      }

      return {
        customer,
        contract: contract ? {
          id: contract.id,
          startDate: contract.startDate,
          endDate: contract.endDate,
          memo: contract.memo,
          status,
          daysRemaining,
        } : null,
      };
    });

    // 잔여일 짧은 순 정렬 (계약 없는 것은 맨 뒤)
    customersWithContracts.sort((a, b) => {
      if (!a.contract && !b.contract) return 0;
      if (!a.contract) return 1;
      if (!b.contract) return -1;
      return (a.contract.daysRemaining || 0) - (b.contract.daysRemaining || 0);
    });

    return NextResponse.json({ customers: customersWithContracts });
  } catch (error: any) {
    console.error("Get customers with contracts error:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "고객사 목록 조회 중 오류가 발생했습니다.", details: error.message },
      { status: 500 }
    );
  }
}
