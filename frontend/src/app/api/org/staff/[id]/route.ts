import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/org/staff/[id] - 직원 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = session.user as any;
    const userRole = user.role;

    if (userRole !== "ORG_ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const staff = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        department: true,
        position: true,
        isActive: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        assignedCustomers: {
          select: {
            id: true,
            isPrimary: true,
            customer: {
              select: {
                id: true,
                name: true,
                businessNumber: true,
              },
            },
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "직원을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ staff });
  } catch (error: any) {
    console.error("Get staff detail error:", error);
    return NextResponse.json(
      { error: "직원 정보 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PATCH /api/org/staff/[id] - 직원 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = session.user as any;
    const userRole = user.role;

    if (userRole !== "ORG_ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { name, phone, department, position, role } = body;

    // 자기 자신은 수정 불가
    if (user.id === params.id) {
      return NextResponse.json(
        { error: "자기 자신의 정보는 수정할 수 없습니다." },
        { status: 400 }
      );
    }

    // 역할 검증
    if (role && !["ORG_ADMIN", "OPERATOR"].includes(role)) {
      return NextResponse.json(
        { error: "유효하지 않은 역할입니다." },
        { status: 400 }
      );
    }

    const updatedStaff = await prisma.user.update({
      where: { id: params.id },
      data: {
        name,
        phone,
        department,
        position,
        ...(role && { role }), // 역할이 제공된 경우에만 업데이트
      },
    });

    // 활동 로그 기록
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "UPDATE_STAFF",
        details: `${updatedStaff.name}의 정보 수정`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      message: "저장되었습니다.",
      staff: updatedStaff,
    });
  } catch (error: any) {
    console.error("Update staff error:", error);
    return NextResponse.json(
      { error: "직원 정보 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/org/staff/[id] - 직원 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = session.user as any;
    const userRole = user.role;

    if (userRole !== "ORG_ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 자기 자신은 삭제 불가
    if (user.id === params.id) {
      return NextResponse.json(
        { error: "자기 자신을 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    const staff = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        name: true,
        role: true,
        _count: {
          select: {
            assignedCustomers: true,
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "직원을 찾을 수 없습니다." }, { status: 404 });
    }

    // 담당 고객사가 있는 경우 삭제 불가
    if (staff._count.assignedCustomers > 0) {
      return NextResponse.json(
        { error: `담당 고객사가 ${staff._count.assignedCustomers}개 있는 직원은 삭제할 수 없습니다.` },
        { status: 400 }
      );
    }

    // 다른 ORG_ADMIN은 삭제 불가
    if (staff.role === "ORG_ADMIN" && userRole === "ORG_ADMIN") {
      return NextResponse.json(
        { error: "다른 관리자를 삭제할 수 없습니다." },
        { status: 403 }
      );
    }

    // 직원 삭제
    await prisma.user.delete({
      where: { id: params.id },
    });

    // 활동 로그 기록
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "DELETE_STAFF",
        details: `${staff.name} 삭제`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ message: "직원이 삭제되었습니다." });
  } catch (error: any) {
    console.error("Delete staff error:", error);
    return NextResponse.json(
      { error: "삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
