import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// 초대 링크 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const organizationId = (session.user as any).organizationId;

    // 권한 체크: 환경측정기업 관리자만
    if (userRole !== "ORG_ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { customerId, adminEmail, adminName, adminPhone, suggestedRole, roleNote, expiryDays = 7, forceCreate = false } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: "고객사 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 고객사 존재 확인
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "고객사를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이미 활성 초대가 있는지 확인
    const existingInvitation = await prisma.customerInvitation.findFirst({
      where: {
        customerId,
        organizationId,
        status: "PENDING",
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (existingInvitation && !forceCreate) {
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('host') || 'localhost:3000';
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
      
      return NextResponse.json(
        {
          error: "이미 활성화된 초대 링크가 있습니다.",
          invitation: existingInvitation,
          inviteUrl: `${baseUrl}/invite/${existingInvitation.token}`,
        },
        { status: 400 }
      );
    }

    // forceCreate인 경우 기존 초대를 취소
    if (existingInvitation && forceCreate) {
      await prisma.customerInvitation.update({
        where: { id: existingInvitation.id },
        data: { status: "CANCELLED" },
      });
    }

    // 초대 토큰 생성 (안전한 랜덤 문자열)
    const token = crypto.randomBytes(32).toString("hex");

    // 만료 시간 계산
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // 트랜잭션으로 처리
    const result = await prisma.$transaction(async (tx) => {
      // 1. 초대 생성
      const invitation = await tx.customerInvitation.create({
        data: {
          token,
          customerId,
          organizationId,
          adminEmail,
          adminName,
          adminPhone,
          suggestedRole,
          roleNote,
          status: "PENDING",
          expiresAt,
          createdBy: userId,
        },
        include: {
          customer: true,
          organization: true,
        },
      });

      // 2. CustomerOrganization 생성 (PENDING 상태)
      const existingConnection = await tx.customerOrganization.findUnique({
        where: {
          customerId_organizationId: {
            customerId,
            organizationId,
          },
        },
      });

      if (!existingConnection) {
        await tx.customerOrganization.create({
          data: {
            customerId,
            organizationId,
            status: "PENDING",
            requestedBy: "ORGANIZATION",
          },
        });
      }

      // 3. 고객사를 공개로 변경 (연결 준비)
      await tx.customer.update({
        where: { id: customerId },
        data: { isPublic: true },
      });

      return invitation;
    });

    const invitation = result;

    // 활동 로그
    await prisma.activityLog.create({
      data: {
        userId,
        action: "CREATE_INVITATION",
        target: "CustomerInvitation",
        targetId: invitation.id,
        details: JSON.stringify({
          customerId,
          customerName: customer.name,
          adminEmail,
          expiresAt,
        }),
      },
    });

    // 초대 링크 생성
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    const inviteUrl = `${baseUrl}/invite/${token}`;

    return NextResponse.json({
      message: "초대 링크가 생성되었습니다.",
      invitation,
      inviteUrl,
    });
  } catch (error: any) {
    console.error("Create invitation error:", error);
    return NextResponse.json(
      { error: "초대 링크 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 초대 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = { organizationId };
    if (status) {
      where.status = status;
    }

    const invitations = await prisma.customerInvitation.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            businessNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invitations });
  } catch (error: any) {
    console.error("Get invitations error:", error);
    return NextResponse.json(
      { error: "초대 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
