import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 회사 검색 API (공개 - 회원가입용)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type"); // "organization" or "customer"

    if (!query || query.length < 2) {
      return NextResponse.json({ companies: [] });
    }

    let companies: any[] = [];

    if (type === "organization") {
      // 환경측정업체(공급회사) 검색 - 승인 대기 중인 업체도 표시
      const organizations = await prisma.organization.findMany({
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

      companies = organizations.map((org) => ({
        id: org.id,
        name: org.name,
        businessNumber: org.businessNumber || "",
        address: org.address || undefined,
        type: "organization",
        isActive: org.isActive, // 승인 상태 포함
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
