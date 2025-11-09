import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 고객사 신규 등록 (공개 API - 회원가입용)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = (body?.name || "").trim();
    const businessNumber = (body?.businessNumber || "").trim();

    if (!name) {
      return NextResponse.json({ error: "고객사명은 필수입니다" }, { status: 400 });
    }

    if (!businessNumber) {
      return NextResponse.json({ error: "사업자등록번호는 필수입니다" }, { status: 400 });
    }

    // 고객사명 중복 체크
    const existingName = await prisma.customer.findFirst({ where: { name } });
    if (existingName) {
      return NextResponse.json({ error: "이미 존재하는 고객사명입니다" }, { status: 400 });
    }

    // 사업자등록번호 중복 체크
    const existingBusiness = await prisma.customer.findUnique({ where: { businessNumber } });
    if (existingBusiness) {
      return NextResponse.json({ error: "이미 등록된 사업자등록번호입니다" }, { status: 400 });
    }

    // 관리자 정보 검증
    if (!body.adminEmail || !body.adminPassword || !body.adminName || !body.adminPhone) {
      return NextResponse.json({ error: "고객사 관리자 정보는 필수입니다" }, { status: 400 });
    }

    // 이메일 중복 체크
    const existingUser = await prisma.user.findUnique({ where: { email: body.adminEmail } });
    if (existingUser) {
      return NextResponse.json({ error: "이미 사용 중인 이메일입니다" }, { status: 400 });
    }

    // 트랜잭션으로 고객사 + 관리자 계정 생성
    const result = await prisma.$transaction(async (tx) => {
      // 고객사 생성
      const customerData: any = {
        name,
        businessNumber,
        isActive: false, // 승인 대기 상태
        isPublic: true, // 직접 가입한 고객사
      };
      if (body.code) customerData.code = body.code.trim();
      if (body.corporateNumber) customerData.corporateNumber = body.corporateNumber.trim();
      if (body.fullName) customerData.fullName = body.fullName.trim();
      if (body.representative) customerData.representative = body.representative.trim();
      if (body.siteType) customerData.siteType = body.siteType.trim();
      if (body.address) customerData.address = body.address.trim();
      if (body.businessType) customerData.businessType = body.businessType.trim();
      if (body.industry) customerData.industry = body.industry.trim();
      if (body.siteCategory) customerData.siteCategory = body.siteCategory.trim();

      const customer = await tx.customer.create({ data: customerData });

      // 고객사 관리자 계정 생성
      const hashedPassword = await bcrypt.hash(body.adminPassword, 10);
      const admin = await tx.user.create({
        data: {
          email: body.adminEmail,
          password: hashedPassword,
          name: body.adminName,
          phone: body.adminPhone,
          role: "CUSTOMER_ADMIN",
          customerId: customer.id,
          companyName: name,
          department: body.adminDepartment,
          position: body.adminPosition,
          status: "PENDING", // 승인 대기
          isActive: false,
          emailVerified: false,
        },
      });

      return { customer, admin };
    });

    return NextResponse.json(
      {
        ok: true,
        data: result.customer,
        message: "고객사 등록 신청이 완료되었습니다. 관리자 승인을 기다려주세요.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register customer error:", error);
    return NextResponse.json(
      { error: "고객사 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
