import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "이메일을 입력해주세요." },
        { status: 400 }
      );
    }

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 보안상 사용자가 없어도 성공 메시지 반환
    if (!user) {
      return NextResponse.json({
        message: "비밀번호 재설정 링크가 이메일로 전송되었습니다.",
      });
    }

    // 기존 토큰 삭제
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        used: false,
      },
    });

    // 새 토큰 생성 (32바이트 랜덤)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1시간 후 만료

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // 이메일 발송
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    const emailResult = await sendPasswordResetEmail(user.email, user.name, resetUrl);
    
    console.log('이메일 발송 결과:', emailResult);
    console.log('발송 대상:', user.email);
    console.log('재설정 URL:', resetUrl);

    if (!emailResult.success) {
      console.error('이메일 발송 실패:', emailResult.error);
    }

    return NextResponse.json({
      message: "비밀번호 재설정 링크가 이메일로 전송되었습니다.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "비밀번호 재설정 요청 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
