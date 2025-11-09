import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 고객회사 상세 조회
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userCustomerId = (session.user as any).customerId;

    // 권한 체크: SUPER_ADMIN이거나, 자신의 고객사 정보를 조회하는 경우
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const isOwnCustomer = (userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER") && userCustomerId === params.id;

    if (!isSuperAdmin && !isOwnCustomer) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            status: true,
            isActive: true,
            department: true,
            position: true,
            createdAt: true,
          },
        },
        stacks: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            users: true,
            stacks: true,
            measurements: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "고객회사를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error: any) {
    console.error("Get customer error:", error);
    return NextResponse.json(
      { error: "고객회사 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();

  try {
    // 이름 중복 체크 (이름 변경 시)
    if (body.name) {
      const existing = await prisma.customer.findFirst({
        where: {
          name: body.name,
          id: { not: id },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "이미 존재하는 고객사명입니다" },
          { status: 400 }
        );
      }
    }

    // 업데이트할 데이터 구성
    // 승인/거부 처리
    if (body.action === "approve") {
      const updated = await prisma.customer.update({
        where: { id },
        data: { isActive: true },
      });
      return NextResponse.json({ message: "고객회사가 승인되었습니다.", customer: updated });
    }

    if (body.action === "reject") {
      const updated = await prisma.customer.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ message: "고객회사가 거부되었습니다.", customer: updated });
    }

    // 일반 정보 수정
    const currentCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    const updateData: any = {};
    const changes: string[] = [];

    if (body.name !== undefined && body.name !== currentCustomer?.name) {
      updateData.name = body.name;
      changes.push(`회사명: ${currentCustomer?.name} → ${body.name}`);
    }
    if (body.businessNumber !== undefined && body.businessNumber !== currentCustomer?.businessNumber) {
      updateData.businessNumber = body.businessNumber;
      changes.push(`사업자번호: ${currentCustomer?.businessNumber || '없음'} → ${body.businessNumber}`);
    }
    if (body.corporateNumber !== undefined && body.corporateNumber !== currentCustomer?.corporateNumber) {
      updateData.corporateNumber = body.corporateNumber;
      changes.push(`법인등록번호: ${currentCustomer?.corporateNumber || '없음'} → ${body.corporateNumber}`);
    }
    if (body.address !== undefined && body.address !== currentCustomer?.address) {
      updateData.address = body.address;
      changes.push(`주소: ${currentCustomer?.address || '없음'} → ${body.address}`);
    }
    if (body.representative !== undefined && body.representative !== currentCustomer?.representative) {
      updateData.representative = body.representative;
      changes.push(`대표자: ${currentCustomer?.representative || '없음'} → ${body.representative}`);
    }
    if (body.businessType !== undefined && body.businessType !== currentCustomer?.businessType) {
      updateData.businessType = body.businessType;
      changes.push(`업태: ${currentCustomer?.businessType || '없음'} → ${body.businessType}`);
    }
    if (body.industry !== undefined && body.industry !== currentCustomer?.industry) {
      updateData.industry = body.industry;
      changes.push(`업종: ${currentCustomer?.industry || '없음'} → ${body.industry}`);
    }
    if (body.siteType !== undefined && body.siteType !== currentCustomer?.siteType) {
      updateData.siteType = body.siteType;
      changes.push(`사업장: ${currentCustomer?.siteType || '없음'} → ${body.siteType}`);
    }
    if (body.siteCategory !== undefined && body.siteCategory !== currentCustomer?.siteCategory) {
      updateData.siteCategory = body.siteCategory;
      changes.push(`사업장종별: ${currentCustomer?.siteCategory || '없음'} → ${body.siteCategory}`);
    }
    if (body.phone !== undefined && body.phone !== currentCustomer?.phone) {
      updateData.phone = body.phone;
      changes.push(`전화번호: ${currentCustomer?.phone || '없음'} → ${body.phone}`);
    }
    if (body.email !== undefined && body.email !== currentCustomer?.email) {
      updateData.email = body.email;
      changes.push(`이메일: ${currentCustomer?.email || '없음'} → ${body.email}`);
    }
    if (body.contactPerson !== undefined && body.contactPerson !== currentCustomer?.contactPerson) {
      updateData.contactPerson = body.contactPerson;
      changes.push(`담당자: ${currentCustomer?.contactPerson || '없음'} → ${body.contactPerson}`);
    }
    if (body.contactPhone !== undefined && body.contactPhone !== currentCustomer?.contactPhone) {
      updateData.contactPhone = body.contactPhone;
      changes.push(`담당자연락처: ${currentCustomer?.contactPhone || '없음'} → ${body.contactPhone}`);
    }
    if (body.isActive !== undefined && body.isActive !== currentCustomer?.isActive) {
      updateData.isActive = body.isActive;
      changes.push(`활성상태: ${currentCustomer?.isActive ? '활성' : '비활성'} → ${body.isActive ? '활성' : '비활성'}`);
    }

    // 환경측정기업이 수정하는 경우 확인 필요 상태로 설정
    updateData.isVerified = false;
    updateData.lastModifiedBy = "ORG";
    updateData.lastModifiedAt = new Date();

    const updated = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    // 해당 고객사의 관리자에게 알림 발송
    const customerAdmins = await prisma.user.findMany({
      where: {
        customerId: id,
        role: "CUSTOMER_ADMIN",
      },
      select: {
        id: true,
      },
    });

    const changeMessage = changes.length > 0
      ? `환경측정기업이 조직 정보를 수정했습니다.\n변경 내역: ${changes.join(', ')}`
      : "환경측정기업이 조직 정보를 수정했습니다.";

    for (const admin of customerAdmins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "CUSTOMER_INFO_UPDATED_BY_ORG",
          title: "조직 정보 수정",
          message: changeMessage,
          customerId: id,
        },
      });
    }
    
    return NextResponse.json({ message: "고객회사 정보가 수정되었습니다.", customer: updated });
  } catch (err: any) {
    console.error("Customer update error:", err);
    return NextResponse.json(
      { error: err.message || "업데이트 실패" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    // 측정 기록 확인
    const measurementCount = await prisma.measurement.count({
      where: { customerId: id },
    });

    if (measurementCount > 0) {
      return NextResponse.json(
        { error: "측정 기록이 있는 고객사는 삭제할 수 없습니다" },
        { status: 400 }
      );
    }

    // 굴뚝 별칭 삭제
    const stacks = await prisma.stack.findMany({
      where: { customerId: id },
      select: { id: true },
    });

    for (const stack of stacks) {
      await prisma.stackAlias.deleteMany({
        where: { stackId: stack.id },
      });
    }

    // 굴뚝 삭제
    await prisma.stack.deleteMany({
      where: { customerId: id },
    });

    // 고객사 삭제
    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
