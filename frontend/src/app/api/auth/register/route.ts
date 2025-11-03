import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      name,
      phone,
      companyName,
      businessNumber,
      department,
      position,
    } = body;

    // 필수 필드 검증
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "이메일, 비밀번호, 이름은 필수입니다." },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "이미 등록된 이메일입니다." },
        { status: 400 }
      );
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);

    // 고객사 정보 확인 (사업자등록번호가 있는 경우)
    let customer = null;
    let isPendingCompany = false;
    if (businessNumber) {
      customer = await prisma.customer.findUnique({
        where: { businessNumber },
      });
      isPendingCompany = customer ? !customer.isActive : false;
    }

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        companyName,
        businessNumber,
        customerId: customer?.id,
        department,
        position,
        role: "CUSTOMER_USER", // 기본 역할
        status: "PENDING", // 승인 대기
        isActive: false, // 승인 전까지 비활성
        emailVerified: false,
      },
    });

    // 활동 로그 기록
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "REGISTER",
        details: JSON.stringify({
          email: user.email,
          name: user.name,
        }),
      },
    });

    // 회사 승인 상태에 따라 메시지 변경
    const message = isPendingCompany
      ? "임시 등록이 완료되었습니다. 회사 승인 후 관리자가 귀하의 가입 신청을 확인합니다."
      : "회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.";

    return NextResponse.json(
      {
        message,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          status: user.status,
        },
        isPendingCompany,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "회원가입 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
