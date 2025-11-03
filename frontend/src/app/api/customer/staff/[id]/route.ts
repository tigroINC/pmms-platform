import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/customer/staff/[id] - 직원 상세 조회
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
    const userCustomerId = user.customerId;

    if (userRole !== "CUSTOMER_ADMIN" && userRole !== "SUPER_ADMIN") {
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
        customerId: true,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "직원을 찾을 수 없습니다." }, { status: 404 });
    }

    // 고객사 관리자는 자신의 고객사 직원만 조회 가능
    if (userRole === "CUSTOMER_ADMIN" && staff.customerId !== userCustomerId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
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

// PATCH /api/customer/staff/[id] - 직원 정보 수정
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
    const userCustomerId = user.customerId;

    if (userRole !== "CUSTOMER_ADMIN" && userRole !== "SUPER_ADMIN") {
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

    // 대상 직원 조회
    const targetStaff = await prisma.user.findUnique({
      where: { id: params.id },
      select: { customerId: true },
    });

    if (!targetStaff) {
      return NextResponse.json({ error: "직원을 찾을 수 없습니다." }, { status: 404 });
    }

    // 고객사 관리자는 자신의 고객사 직원만 수정 가능
    if (userRole === "CUSTOMER_ADMIN" && targetStaff.customerId !== userCustomerId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 역할 검증
    if (role && !["CUSTOMER_ADMIN", "CUSTOMER_USER"].includes(role)) {
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

// DELETE /api/customer/staff/[id] - 직원 삭제
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
    const userCustomerId = user.customerId;

    if (userRole !== "CUSTOMER_ADMIN" && userRole !== "SUPER_ADMIN") {
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
        customerId: true,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "직원을 찾을 수 없습니다." }, { status: 404 });
    }

    // 고객사 관리자는 자신의 고객사 직원만 삭제 가능
    if (userRole === "CUSTOMER_ADMIN" && staff.customerId !== userCustomerId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 다른 CUSTOMER_ADMIN은 삭제 불가
    if (staff.role === "CUSTOMER_ADMIN" && userRole === "CUSTOMER_ADMIN") {
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
