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
    const updateData: any = {};
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.name) updateData.name = body.name;
    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.code !== undefined) updateData.code = body.code;
    if (body.businessNumber !== undefined) updateData.businessNumber = body.businessNumber;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.industry !== undefined) updateData.industry = body.industry;
    if (body.siteType !== undefined) updateData.siteType = body.siteType;
    if (body.siteCategory !== undefined) updateData.siteCategory = body.siteCategory;

    const updated = await prisma.customer.update({
      where: { id },
      data: updateData,
    });
    
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
