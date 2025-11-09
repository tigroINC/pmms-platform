import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 고객사의 연결된 환경측정기업 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    console.log("[API /api/connections/by-customer] customerId:", customerId);

    if (!customerId) {
      return NextResponse.json(
        { error: "고객사 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 같은 사업자번호를 가진 모든 고객사 조회
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { businessNumber: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "고객사를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    let customerIds = [customerId];
    if (customer.businessNumber) {
      const sameBusinessCustomers = await prisma.customer.findMany({
        where: { businessNumber: customer.businessNumber },
        select: { id: true },
      });
      customerIds = sameBusinessCustomers.map(c => c.id);
      console.log("[API /api/connections/by-customer] sameBusinessCustomers:", customerIds);
    }

    const connections = await prisma.customerOrganization.findMany({
      where: {
        customerId: { in: customerIds },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            businessNumber: true,
            phone: true,
            email: true,
            address: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // PENDING 먼저
        { createdAt: "desc" },
      ],
    });

    console.log("[API /api/connections/by-customer] Found connections:", connections.length);
    console.log("[API /api/connections/by-customer] Connections:", connections.map(c => ({
      id: c.id,
      orgName: c.organization.name,
      status: c.status
    })));

    // 계약 정보 조회
    let contracts: any[] = [];
    if (connections.length > 0) {
      const organizationIds = connections.map(c => c.organizationId);
      contracts = await prisma.contract.findMany({
        where: {
          customerId,
          organizationId: { in: organizationIds },
        },
        select: {
          organizationId: true,
          startDate: true,
          endDate: true,
        },
      });
    }

    console.log("[API /api/connections/by-customer] Found contracts:", contracts.length);

    // 계약 정보 매핑
    const now = new Date();
    const connectionsWithContracts = connections.map(conn => {
      const contract = contracts.find(c => c.organizationId === conn.organizationId);
      let daysRemaining = null;
      
      if (contract) {
        const endDate = new Date(contract.endDate);
        const diffTime = endDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      
      return {
        id: conn.id,
        status: conn.status,
        requestedBy: conn.requestedBy,
        customCode: conn.customCode,
        createdAt: conn.createdAt,
        organization: conn.organization,
        contractStartDate: contract?.startDate || null,
        contractEndDate: contract?.endDate || null,
        daysRemaining,
        siteType: (conn.proposedData as any)?.siteType || null,
        proposedData: conn.proposedData,
      };
    });

    return NextResponse.json({ connections: connectionsWithContracts });
  } catch (error: any) {
    console.error("Get customer organizations error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "연결 목록 조회 중 오류가 발생했습니다.", details: error.message },
      { status: 500 }
    );
  }
}
