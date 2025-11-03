import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/auth/accept-invite - 초대 수락 및 비밀번호 설정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "토큰과 비밀번호가 필요합니다." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "비밀번호는 최소 8자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    // 토큰으로 사용자 찾기
    const user = await prisma.user.findFirst({
      where: {
        inviteToken: token,
        inviteTokenExpiry: {
          gte: new Date(),
        },
        status: "PENDING",
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "유효하지 않거나 만료된 초대 링크입니다." },
        { status: 404 }
      );
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 활성화 및 비밀번호 설정
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        status: "APPROVED",
        isActive: true,
        inviteToken: null,
        inviteTokenExpiry: null,
      },
    });

    // 활동 로그 기록
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "ACCEPT_INVITE",
        details: `${user.name}이(가) 초대를 수락하고 계정을 활성화함`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      message: "계정이 활성화되었습니다.",
    });
  } catch (error: any) {
    console.error("Accept invite error:", error);
    return NextResponse.json(
      { error: "계정 활성화 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
