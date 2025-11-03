import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/org/staff/[id]/assign-customers - 담당 고객사 할당
export async function POST(
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
    const { customerIds, primaryCustomerId } = body;

    if (!Array.isArray(customerIds)) {
      return NextResponse.json(
        { error: "고객사 ID 목록이 필요합니다." },
        { status: 400 }
      );
    }

    // 기존 할당 삭제
    await prisma.customerAssignment.deleteMany({
      where: { userId: params.id },
    });

    // 새로운 할당 생성
    if (customerIds.length > 0) {
      await prisma.customerAssignment.createMany({
        data: customerIds.map((customerId: string) => ({
          userId: params.id,
          customerId,
          isPrimary: customerId === primaryCustomerId,
          assignedBy: user.id,
        })),
      });
    }

    // 활동 로그 기록
    const staff = await prisma.user.findUnique({
      where: { id: params.id },
      select: { name: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "ASSIGN_CUSTOMERS",
        details: `${staff?.name}에게 ${customerIds.length}개 고객사 할당`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ message: "담당 고객사가 할당되었습니다." });
  } catch (error: any) {
    console.error("Assign customers error:", error);
    return NextResponse.json(
      { error: "담당 고객사 할당 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
