import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 초대 수락 및 회원가입
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const body = await request.json();
    const { email, password, name, phone, role, businessNumber } = body;

    // 필수 필드 검증
    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { error: "모든 필드를 입력해주세요." },
        { status: 400 }
      );
    }

    // 역할 검증 (ADMIN, USER도 허용 - 나중에 변환됨)
    if (role && role !== "CUSTOMER_ADMIN" && role !== "CUSTOMER_USER" && role !== "ADMIN" && role !== "USER") {
      return NextResponse.json(
        { error: "유효하지 않은 역할입니다." },
        { status: 400 }
      );
    }

    // 초대 정보 조회
    const invitation = await prisma.customerInvitation.findUnique({
      where: { token },
      include: {
        customer: true,
        organization: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "유효하지 않은 초대 링크입니다." },
        { status: 404 }
      );
    }

    if (invitation.status === "USED") {
      return NextResponse.json(
        { error: "이미 사용된 초대 링크입니다." },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "만료된 초대 링크입니다." },
        { status: 400 }
      );
    }

    // 이메일 중복 체크
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "이미 사용 중인 이메일입니다." },
        { status: 400 }
      );
    }

    // 트랜잭션으로 처리
    const result = await prisma.$transaction(async (tx) => {
      // 1. 사용자 생성
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // 역할 결정 (suggestedRole 기본값, role 파라미터 우선)
      const userRole = role || invitation.suggestedRole || "ADMIN";
      
      // 역할 변환: ADMIN -> CUSTOMER_ADMIN, USER -> CUSTOMER_USER
      let finalRole: string;
      if (userRole === "ADMIN" || userRole === "CUSTOMER_ADMIN") {
        finalRole = "CUSTOMER_ADMIN";
      } else if (userRole === "USER" || userRole === "CUSTOMER_USER") {
        finalRole = "CUSTOMER_USER";
      } else {
        finalRole = "CUSTOMER_ADMIN"; // 기본값
      }
      
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          role: finalRole,
          customerId: invitation.customerId,
          companyName: invitation.customer.name,
          status: "APPROVED",
          isActive: true,
          emailVerified: true,
          accessScope: "SITE",
        },
      });

      // 2. businessNumber 업데이트 (선택 입력)
      if (businessNumber && businessNumber.trim()) {
        await tx.customer.update({
          where: { id: invitation.customerId },
          data: { businessNumber: businessNumber.trim() },
        });
      }

      // 3. CustomerOrganization 승인 (이미 존재하면 APPROVED로 변경, 없으면 생성)
      const existingConnection = await tx.customerOrganization.findUnique({
        where: {
          customerId_organizationId: {
            customerId: invitation.customerId,
            organizationId: invitation.organizationId,
          },
        },
      });

      let connection;
      if (existingConnection) {
        // 기존 연결을 APPROVED로 변경
        connection = await tx.customerOrganization.update({
          where: { id: existingConnection.id },
          data: {
            status: "APPROVED",
            approvedAt: new Date(),
            approvedBy: user.id,
          },
        });
      } else {
        // 새 연결 생성 (즉시 승인)
        connection = await tx.customerOrganization.create({
          data: {
            customerId: invitation.customerId,
            organizationId: invitation.organizationId,
            status: "APPROVED",
            requestedBy: "ORGANIZATION",
            approvedAt: new Date(),
            approvedBy: user.id,
          },
        });
      }

      // 4. 초대 사용 처리
      await tx.customerInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "USED",
          usedAt: new Date(),
          usedBy: user.id,
        },
      });

      // 5. 고객사를 공개로 변경
      await tx.customer.update({
        where: { id: invitation.customerId },
        data: { isPublic: true },
      });

      // 6. 활동 로그
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "ACCEPT_INVITATION",
          target: "CustomerInvitation",
          targetId: invitation.id,
          details: JSON.stringify({
            customerName: invitation.customer.name,
            organizationName: invitation.organization.name,
          }),
        },
      });

      return { user, connection };
    });

    return NextResponse.json({
      message: "가입이 완료되었습니다. 로그인해주세요.",
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
    });
  } catch (error: any) {
    console.error("Accept invitation error:", error);
    return NextResponse.json(
      { error: "초대 수락 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
