import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 임직원(OPERATOR) 회원가입
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessNumber, // 소속 공급회사 사업자등록번호
      email,
      password,
      name,
      phone,
      department,
      position,
    } = body;

    // 필수 항목 검증
    if (!businessNumber || !email || !password || !name || !phone) {
      return NextResponse.json(
        { error: "필수 항목을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    // 환경측정기업 확인
    const organization = await prisma.organization.findUnique({
      where: { businessNumber },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "등록되지 않은 환경측정기업입니다. 사업자등록번호를 확인해주세요." },
        { status: 404 }
      );
    }

    if (!organization.isActive) {
      return NextResponse.json(
        { error: "승인되지 않은 환경측정기업입니다." },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "이미 사용 중인 이메일입니다." },
        { status: 400 }
      );
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);

    // 임직원 계정 생성 (승인 대기 상태)
    const operator = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: "OPERATOR",
        organizationId: organization.id,
        companyName: organization.name,
        department,
        position,
        status: "PENDING", // 승인 대기
        isActive: false,
        emailVerified: false,
      },
    });

    // 활동 로그
    await prisma.activityLog.create({
      data: {
        userId: operator.id,
        action: "REGISTER_OPERATOR",
        target: "User",
        targetId: operator.id,
        details: JSON.stringify({
          organizationName: organization.name,
          businessNumber,
        }),
      },
    });

    // 회사 승인 상태에 따라 메시지 변경
    const message = organization.isActive
      ? "회원가입 신청이 완료되었습니다. 환경측정기업 관리자의 승인을 기다려주세요."
      : "임시 등록이 완료되었습니다. 회사 승인 후 관리자가 귀하의 가입 신청을 확인합니다.";

    return NextResponse.json({
      message,
      email: operator.email,
      isPendingCompany: !organization.isActive,
    });
  } catch (error: any) {
    console.error("Operator registration error:", error);
    return NextResponse.json(
      { error: "회원가입 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
