import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 환경측정기업 회원가입
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      // Organization 정보
      name,
      businessNumber,
      corporateNumber,
      businessType,
      address,
      phone,
      email,
      representative,
      website,
      fax,
      establishedDate,
      // 관리자 정보
      adminEmail,
      adminPassword,
      adminName,
      adminPhone,
      adminDepartment,
      adminPosition,
      // 기타
      registrationReason,
      notes,
    } = body;

    // 필수 항목 시스템 설정 조회
    const settings = await prisma.systemSettings.findUnique({
      where: { key: "org_registration_required_fields" },
    });

    let requiredFields = ["name", "businessNumber"];
    if (settings) {
      const config = JSON.parse(settings.value);
      requiredFields = config.required || requiredFields;
    }

    // 필수 항목 검증
    const orgData: any = {
      name,
      businessNumber,
      corporateNumber,
      businessType,
      address,
      phone,
      email,
      representative,
      website,
      fax,
      establishedDate: establishedDate ? new Date(establishedDate) : null,
    };

    for (const field of requiredFields) {
      if (!orgData[field]) {
        return NextResponse.json(
          { error: `${field}은(는) 필수 입력 항목입니다.` },
          { status: 400 }
        );
      }
    }

    // 관리자 필수 항목 검증
    if (!adminEmail || !adminPassword || !adminName || !adminPhone) {
      return NextResponse.json(
        { error: "관리자 정보(이메일, 비밀번호, 이름, 전화번호)는 필수입니다." },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "이미 사용 중인 이메일입니다." },
        { status: 400 }
      );
    }

    // 사업자등록번호 중복 확인
    if (businessNumber) {
      const existingOrg = await prisma.organization.findUnique({
        where: { businessNumber },
      });

      if (existingOrg) {
        return NextResponse.json(
          { error: "이미 등록된 사업자등록번호입니다." },
          { status: 400 }
        );
      }
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Organization과 관리자 계정 생성 (트랜잭션)
    const result = await prisma.$transaction(async (tx) => {
      // Organization 생성 (승인 대기 상태)
      const organization = await tx.organization.create({
        data: {
          ...orgData,
          subscriptionPlan: "FREE",
          subscriptionStatus: "TRIAL",
          isActive: false, // 승인 전까지 비활성
        },
      });

      // 관리자 계정 생성 (승인 대기 상태)
      const admin = await tx.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: adminName,
          phone: adminPhone,
          role: "ORG_ADMIN",
          organizationId: organization.id,
          companyName: name,
          department: adminDepartment,
          position: adminPosition,
          status: "PENDING", // 승인 대기
          isActive: false,
          emailVerified: false,
        },
      });

      // 활동 로그 (시스템 로그)
      await tx.activityLog.create({
        data: {
          userId: admin.id,
          action: "REGISTER_ORGANIZATION",
          target: "Organization",
          targetId: organization.id,
          details: JSON.stringify({
            organizationName: name,
            businessNumber,
            registrationReason,
            notes,
          }),
        },
      });

      return { organization, admin };
    });

    return NextResponse.json({
      message: "회원가입 신청이 완료되었습니다. 시스템 관리자의 승인을 기다려주세요.",
      organizationId: result.organization.id,
      adminEmail: result.admin.email,
    });
  } catch (error: any) {
    console.error("Organization registration error:", error);
    return NextResponse.json(
      { error: "회원가입 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
