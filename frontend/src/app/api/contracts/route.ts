import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 계약 목록 조회
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const organizationId = (session.user as any).organizationId;

    // 권한 체크
    if (userRole !== "SUPER_ADMIN" && userRole !== "ORG_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 조직의 계약 관리 기능 활성화 여부 확인
    if (organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { hasContractManagement: true },
      });

      if (!org?.hasContractManagement) {
        return NextResponse.json({ error: "계약 관리 기능이 비활성화되어 있습니다." }, { status: 403 });
      }
    }

    // 계약 목록 조회
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            businessNumber: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        endDate: "asc", // 만료일 가까운 순
      },
    });

    // 잔여 일수 계산 및 상태 업데이트
    const now = new Date();
    const contractsWithDays = contracts.map((contract) => {
      const endDate = new Date(contract.endDate);
      const diffTime = endDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let status = "ACTIVE";
      if (daysRemaining < 0) {
        status = "EXPIRED";
      } else if (daysRemaining <= 28) {
        status = "EXPIRING";
      }

      return {
        ...contract,
        daysRemaining,
        status,
      };
    });

    return NextResponse.json({ contracts: contractsWithDays });
  } catch (error: any) {
    console.error("Get contracts error:", error);
    return NextResponse.json(
      { error: "계약 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 계약 생성
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const organizationId = (session.user as any).organizationId;

    // 권한 체크
    if (userRole !== "SUPER_ADMIN" && userRole !== "ORG_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { customerId, startDate, endDate, memo } = body;

    if (!customerId || !startDate || !endDate) {
      return NextResponse.json({ error: "필수 정보를 입력해주세요." }, { status: 400 });
    }

    // 날짜 검증
    if (new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json({ error: "종료일은 시작일보다 이후여야 합니다." }, { status: 400 });
    }

    // 기존 계약 확인
    const existingContract = await prisma.contract.findFirst({
      where: {
        organizationId: organizationId!,
        customerId,
      },
    });

    let contract;
    if (existingContract) {
      // 기존 계약 업데이트 - 트랜잭션으로 처리
      contract = await prisma.$transaction(async (tx) => {
        // 계약 업데이트
        const updatedContract = await tx.contract.update({
          where: { id: existingContract.id },
          data: {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            memo: memo || null,
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                businessNumber: true,
              },
            },
          },
        });

        // CustomerOrganization의 알림 플래그 리셋
        await tx.customerOrganization.updateMany({
          where: {
            organizationId: organizationId!,
            customerId,
          },
          data: {
            contractStartDate: new Date(startDate),
            contractEndDate: new Date(endDate),
            notified30Days: false,
            notified21Days: false,
            notified14Days: false,
            notified7Days: false,
            notifiedExpiry: false,
          },
        });

        // 해당 고객사 관련 계약 만료 알림 삭제
        await tx.notification.deleteMany({
          where: {
            customerId: customerId,
            type: {
              in: [
                "CONTRACT_EXPIRY_30",
                "CONTRACT_EXPIRY_21",
                "CONTRACT_EXPIRY_14",
                "CONTRACT_EXPIRY_7",
                "CONTRACT_EXPIRY_DAILY",
                "CONTRACT_EXPIRED",
              ],
            },
          },
        });

        return updatedContract;
      });
    } else {
      // 새 계약 생성 - 트랜잭션으로 처리
      contract = await prisma.$transaction(async (tx) => {
        // 계약 생성
        const newContract = await tx.contract.create({
          data: {
            organizationId: organizationId!,
            customerId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            memo: memo || null,
            createdBy: userId,
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                businessNumber: true,
              },
            },
          },
        });

        // CustomerOrganization에 계약 정보 동기화
        await tx.customerOrganization.updateMany({
          where: {
            organizationId: organizationId!,
            customerId,
          },
          data: {
            contractStartDate: new Date(startDate),
            contractEndDate: new Date(endDate),
          },
        });

        return newContract;
      });
    }

    return NextResponse.json({ contract });
  } catch (error: any) {
    console.error("Create contract error:", error);
    return NextResponse.json(
      { error: "계약 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
