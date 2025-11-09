import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 연결 승인
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // 연결 요청 조회
    const connection = await prisma.customerOrganization.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        organization: true,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "연결 요청을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 체크
    if (connection.requestedBy === "CUSTOMER") {
      // 고객사가 요청 → 환경측정기업 관리자 또는 시스템 관리자가 승인
      if (userRole !== "ORG_ADMIN" && userRole !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
      }
    } else {
      // 환경측정기업이 초대 → 고객사 관리자 또는 시스템 관리자가 승인
      if (userRole !== "CUSTOMER_ADMIN" && userRole !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
      }
    }

    if (connection.status !== "PENDING") {
      return NextResponse.json(
        { error: "이미 처리된 요청입니다." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { contractStartDate, contractEndDate } = body;

    // Transaction으로 승인 + DRAFT 굴뚝 전환 처리
    const updated = await prisma.$transaction(async (tx) => {
      // 1. 연결 승인
      const approvedConnection = await tx.customerOrganization.update({
        where: { id: params.id },
        data: {
          status: "APPROVED",
          approvedBy: userId,
          approvedAt: new Date(),
          contractStartDate: contractStartDate 
            ? new Date(contractStartDate) 
            : connection.contractStartDate,
          contractEndDate: contractEndDate 
            ? new Date(contractEndDate) 
            : connection.contractEndDate,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // 2. Customer 정보 병합 및 상태 업데이트
      const currentCustomer = await tx.customer.findUnique({
        where: { id: connection.customerId },
      });

      if (currentCustomer) {
        const updateData: any = {};
        
        // proposedData가 있으면 빈 필드 채우기 (병합 연결)
        if (connection.proposedData) {
          const proposed = connection.proposedData as any;
          
          if (!currentCustomer.code && proposed.code) updateData.code = proposed.code;
          if (!currentCustomer.corporateNumber && proposed.corporateNumber) updateData.corporateNumber = proposed.corporateNumber;
          if (!currentCustomer.fullName && proposed.fullName) updateData.fullName = proposed.fullName;
          if (!currentCustomer.representative && proposed.representative) updateData.representative = proposed.representative;
          if (!currentCustomer.siteType && proposed.siteType) updateData.siteType = proposed.siteType;
          if (!currentCustomer.address && proposed.address) updateData.address = proposed.address;
          if (!currentCustomer.businessType && proposed.businessType) updateData.businessType = proposed.businessType;
          if (!currentCustomer.industry && proposed.industry) updateData.industry = proposed.industry;
          if (!currentCustomer.siteCategory && proposed.siteCategory) updateData.siteCategory = proposed.siteCategory;
          
          // 내부 고객사 ID가 있으면 병합 처리
          if (proposed.internalCustomerId) {
            await tx.customer.update({
              where: { id: proposed.internalCustomerId },
              data: {
                mergedIntoId: connection.customerId,
                mergedAt: new Date(),
              },
            });
          }
        }

        // 상태 업데이트
        if (currentCustomer.status === "DRAFT") {
          updateData.status = "CONNECTED";
        }
        updateData.isPublic = true;

        await tx.customer.update({
          where: { id: connection.customerId },
          data: updateData,
        });
      }

      // 3. DRAFT 굴뚝 찾기
      const draftStacks = await tx.stack.findMany({
        where: {
          customerId: connection.customerId,
          draftCreatedBy: connection.organizationId,
          status: "DRAFT" as any,
        },
      });

      // 4. DRAFT → PENDING_REVIEW 전환
      if (draftStacks.length > 0) {
        await tx.stack.updateMany({
          where: {
            customerId: connection.customerId,
            draftCreatedBy: connection.organizationId,
            status: "DRAFT" as any,
          },
          data: {
            status: "PENDING_REVIEW" as any,
          },
        });

        // 5. 알림 생성 (고객사에게)
        // TODO: Notification 테이블이 있다면 여기서 생성
        console.log(
          `[연결 승인] ${draftStacks.length}개 굴뚝이 검토 대기 상태로 전환되었습니다.`
        );
      }

      // 6. 활동 로그
      await tx.activityLog.create({
        data: {
          userId: userId,
          action: "APPROVE_CONNECTION",
          target: "CustomerOrganization",
          targetId: params.id,
          details: JSON.stringify({
            customerId: connection.customerId,
            customerName: connection.customer.name,
            organizationId: connection.organizationId,
            organizationName: connection.organization.name,
            draftStacksConverted: draftStacks.length,
          }),
        },
      });

      return approvedConnection;
    });

    return NextResponse.json({
      message: "연결이 승인되었습니다.",
      connection: updated,
    });
  } catch (error: any) {
    console.error("Approve connection error:", error);
    return NextResponse.json(
      { error: "연결 승인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
