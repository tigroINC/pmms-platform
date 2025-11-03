import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 초대 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const invitation = await prisma.customerInvitation.findUnique({
      where: { token },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            fullName: true,
            businessNumber: true,
            address: true,
            industry: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            businessNumber: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "유효하지 않은 초대 링크입니다." },
        { status: 404 }
      );
    }

    if (invitation.status === "USED") {
      return NextResponse.json(
        { error: "이미 사용된 초대 링크입니다." },
        { status: 400 }
      );
    }

    if (invitation.status === "EXPIRED" || invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "만료된 초대 링크입니다." },
        { status: 400 }
      );
    }

    return NextResponse.json({ invitation });
  } catch (error: any) {
    console.error("Get invitation error:", error);
    return NextResponse.json(
      { error: "초대 정보 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
