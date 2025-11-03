import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/customer/staff - 고객사 직원 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = session.user as any;
    const userRole = user.role;
    const customerId = user.customerId;

    // 권한 확인
    if (userRole !== "CUSTOMER_ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // CUSTOMER_ADMIN은 자사 직원만 조회 가능
    if (userRole === "CUSTOMER_ADMIN" && !customerId) {
      return NextResponse.json({ error: "고객사 정보가 없습니다." }, { status: 400 });
    }

    // 쿼리 파라미터
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "ALL";
    const role = searchParams.get("role") || "ALL";

    // 필터 조건 구성
    const where: any = {
      role: {
        in: ["CUSTOMER_ADMIN", "CUSTOMER_USER"],
      },
    };

    // 고객사 관리자는 자사 직원만
    if (userRole === "CUSTOMER_ADMIN") {
      where.customerId = customerId;
    }

    // 검색
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // 상태 필터
    if (status !== "ALL") {
      where.isActive = status === "ACTIVE";
    }

    // 역할 필터
    if (role !== "ALL") {
      where.role = role;
    }

    const staff = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        department: true,
        position: true,
        phone: true,
        createdAt: true,
        lastLoginAt: true,
        status: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ staff });
  } catch (error: any) {
    console.error("Get customer staff error:", error);
    return NextResponse.json(
      { error: "직원 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
