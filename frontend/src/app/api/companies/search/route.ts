import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 회사 검색 API (공개 - 회원가입용)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type"); // "organization" or "customer"
    const customerId = searchParams.get("customerId"); // 고객사 ID (연결 제외용)

    if (!query || query.length < 2) {
      return NextResponse.json({ companies: [] });
    }

    let companies: any[] = [];

    if (type === "organization") {
      // 환경측정업체(공급회사) 검색
      const whereCondition: any = {
        OR: [
          { name: { contains: query } },
          { businessNumber: { contains: query } },
        ],
      };

      // 고객사가 검색하는 경우, 이미 연결된(DISCONNECTED 제외) 기업 제외
      if (customerId) {
        const existingConnections = await prisma.customerOrganization.findMany({
          where: {
            customerId: customerId,
            status: { in: ["PENDING", "APPROVED", "REJECTED"] }, // DISCONNECTED는 재연결 가능
          },
          select: { organizationId: true },
        });
        
        const excludeOrgIds = existingConnections.map(c => c.organizationId);
        if (excludeOrgIds.length > 0) {
          whereCondition.id = { notIn: excludeOrgIds };
        }
      }

      const organizations = await prisma.organization.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          businessNumber: true,
          address: true,
          isActive: true,
          phone: true,
        },
        take: 10,
        orderBy: { name: "asc" },
      });

      companies = organizations.map((org) => ({
        id: org.id,
        name: org.name,
        businessNumber: org.businessNumber || "",
        address: org.address || undefined,
        phone: org.phone || undefined,
        type: "organization",
        isActive: org.isActive,
      }));
    } else if (type === "customer") {
      // 고객사 검색 - 승인 대기 중인 업체도 표시
      const customers = await prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { businessNumber: { contains: query } },
          ],
        },
        select: {
          id: true,
          name: true,
          businessNumber: true,
          address: true,
          isActive: true,
        },
        take: 10,
        orderBy: { name: "asc" },
      });

      companies = customers.map((cust) => ({
        id: cust.id,
        name: cust.name,
        businessNumber: cust.businessNumber || "",
        address: cust.address || undefined,
        type: "customer",
        isActive: cust.isActive, // 승인 상태 포함
      }));
    }

    return NextResponse.json({ companies });
  } catch (error: any) {
    console.error("Search companies error:", error);
    return NextResponse.json(
      { error: "회사 검색 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
