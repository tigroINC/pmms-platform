import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/org/staff - 직원 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = session.user as any;
    const userRole = user.role;

    // ORG_ADMIN만 접근 가능
    if (userRole !== "ORG_ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "ALL";
    const role = searchParams.get("role") || "ALL";
    const organizationId = searchParams.get("organizationId");

    // 조직 ID 결정
    let targetOrgId: string | null = null;
    
    if (userRole === "SUPER_ADMIN") {
      // SUPER_ADMIN: 쿼리 파라미터의 organizationId 사용 (시스템 보기 모드)
      if (organizationId) {
        targetOrgId = organizationId;
      } else {
        // organizationId가 없으면 현재 사용자의 organizationId 사용
        const currentUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { organizationId: true },
        });
        targetOrgId = currentUser?.organizationId || null;
      }
    } else {
      // ORG_ADMIN: 자신의 조직만
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { organizationId: true },
      });
      
      if (!currentUser?.organizationId) {
        return NextResponse.json({ error: "조직 정보가 없습니다." }, { status: 400 });
      }
      
      targetOrgId = currentUser.organizationId;
    }

    if (!targetOrgId) {
      return NextResponse.json({ error: "조직 정보가 없습니다." }, { status: 400 });
    }

    // 필터 조건 구성
    const where: any = {
      organizationId: targetOrgId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (status === "ACTIVE") {
      where.isActive = true;
    } else if (status === "INACTIVE") {
      where.isActive = false;
    }

    if (role !== "ALL") {
      where.role = role;
    }

    // 직원 목록 조회
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
        _count: {
          select: {
            assignedCustomers: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ staff });
  } catch (error: any) {
    console.error("Get staff error:", error);
    return NextResponse.json(
      { error: "직원 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
