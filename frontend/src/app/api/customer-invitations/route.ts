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
    const { customerId, adminEmail, adminName, adminPhone, suggestedRole, roleNote, siteType, expiryDays = 7, forceCreate = false } = body;

    console.log("[API /api/customer-invitations] Request body:", { customerId, adminEmail, siteType });

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

    // 이메일이 이미 같은 사업자번호의 고객사에 가입되어 있는지 확인
    let isExistingEmail = false;
    if (adminEmail && customer.businessNumber) {
      // 같은 사업자번호를 가진 모든 고객사 조회
      const sameBusinessCustomers = await prisma.customer.findMany({
        where: {
          businessNumber: customer.businessNumber,
        },
        select: {
          id: true,
        },
      });

      const customerIds = sameBusinessCustomers.map(c => c.id);

      // 해당 고객사들에 이미 가입된 이메일인지 확인
      const existingUser = await prisma.user.findFirst({
        where: {
          email: adminEmail,
          customerId: { in: customerIds },
          role: { in: ["CUSTOMER_ADMIN", "CUSTOMER_USER"] },
        },
      });
      isExistingEmail = !!existingUser;
      console.log("[API /api/customer-invitations] businessNumber:", customer.businessNumber);
      console.log("[API /api/customer-invitations] sameBusinessCustomers:", customerIds);
      console.log("[API /api/customer-invitations] isExistingEmail:", isExistingEmail, "existingUser:", existingUser?.id);
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
      // 같은 사업장에 대한 연결이 이미 있는지 확인 (PENDING 또는 APPROVED)
      const existingConnection = await tx.customerOrganization.findFirst({
        where: {
          customerId,
          organizationId,
          OR: [
            { status: "PENDING" },
            { status: "APPROVED" }
          ],
          proposedData: siteType ? {
            path: "siteType",
            equals: siteType
          } : undefined,
        },
      });

      if (existingConnection) {
        // 같은 사업장에 대한 연결이 이미 존재
        return NextResponse.json(
          { 
            error: `이 사업장(${siteType || '미지정'})에 대한 ${existingConnection.status === 'APPROVED' ? '연결이 이미 승인되었습니다' : '초대가 이미 존재합니다'}.`,
          },
          { status: 400 }
        );
      }

      // 새 연결 생성 - 고객사 전체 정보를 proposedData에 저장
      const newConnection = await tx.customerOrganization.create({
        data: {
          customerId,
          organizationId,
          status: "PENDING",
          requestedBy: "ORGANIZATION",
          proposedData: {
            siteType: siteType || customer.siteType,
            name: customer.name,
            businessNumber: customer.businessNumber,
            corporateNumber: customer.corporateNumber,
            fullName: customer.fullName,
            representative: customer.representative,
            address: customer.address,
            businessType: customer.businessType,
            industry: customer.industry,
            siteCategory: customer.siteCategory,
          },
        },
      });
      
      // 같은 사업자번호의 모든 고객사 사용자들에게 알림 생성
      if (isExistingEmail && customer.businessNumber) {
        // 같은 사업자번호를 가진 모든 고객사 조회
        const sameBusinessCustomers = await tx.customer.findMany({
          where: {
            businessNumber: customer.businessNumber,
          },
          select: {
            id: true,
          },
        });

        const customerIds = sameBusinessCustomers.map(c => c.id);

        const customerUsers = await tx.user.findMany({
          where: { 
            customerId: { in: customerIds }, 
            role: { in: ["CUSTOMER_ADMIN", "CUSTOMER_USER"] } 
          },
        });
        
        for (const user of customerUsers) {
          await tx.notification.create({
            data: {
              userId: user.id,
              type: "CONNECTION_REQUEST",
              title: "새 사업장 연결 요청",
              message: `${customer.name}의 ${siteType || customer.siteType || '새 사업장'}에 대한 연결 요청이 있습니다.`,
              customerId: customerId,
            },
          });
        }
      }

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
      isExistingEmail,
      autoConnectMessage: isExistingEmail 
        ? `${adminEmail}은(는) 이미 연결된 계정입니다. 고객시스템에서 고객이 초대를 승인하면 해당 계정에 새 사업장 연결이 자동으로 추가됩니다.`
        : null,
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
