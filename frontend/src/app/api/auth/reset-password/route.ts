import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "토큰과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    // 비밀번호 유효성 검사
    if (password.length < 8) {
      return NextResponse.json(
        { error: "비밀번호는 최소 8자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    // 토큰 찾기
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다." },
        { status: 400 }
      );
    }

    // 토큰 만료 확인
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "토큰이 만료되었습니다. 다시 요청해주세요." },
        { status: 400 }
      );
    }

    // 토큰 사용 여부 확인
    if (resetToken.used) {
      return NextResponse.json(
        { error: "이미 사용된 토큰입니다." },
        { status: 400 }
      );
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);

    // 비밀번호 업데이트 및 토큰 사용 처리
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          passwordResetRequired: false,
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({
      message: "비밀번호가 성공적으로 변경되었습니다.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "비밀번호 재설정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
