import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 계약 만료 알림 배치 작업
// Cron job 또는 스케줄러에서 호출
export async function POST(request: Request) {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 만료 예정 계약 조회 (28일 이내)
    const expiringContracts = await prisma.contract.findMany({
      where: {
        endDate: {
          gte: today,
          lte: new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000), // 28일 후
        },
        status: {
          in: ["ACTIVE", "EXPIRING"],
        },
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
            hasContractManagement: true,
            users: {
              where: {
                role: "ORG_ADMIN",
                isActive: true,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    const notifications = [];

    for (const contract of expiringContracts) {
      // 계약 관리 기능이 비활성화된 조직은 스킵
      if (!contract.organization.hasContractManagement) {
        continue;
      }

      const endDate = new Date(contract.endDate);
      const diffTime = endDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 알림 조건 체크
      let shouldNotify = false;
      let notifyReason = "";

      if (daysRemaining <= 7) {
        // 마지막 주: 매일 알림
        shouldNotify = true;
        notifyReason = `계약 만료 ${daysRemaining}일 전`;
      } else if (daysRemaining <= 28) {
        // 28일 전 ~ 8일 전: 1주일 단위 알림
        const lastNotified = contract.lastNotifiedAt ? new Date(contract.lastNotifiedAt) : null;
        if (!lastNotified || (today.getTime() - lastNotified.getTime()) >= 7 * 24 * 60 * 60 * 1000) {
          shouldNotify = true;
          notifyReason = `계약 만료 ${daysRemaining}일 전`;
        }
      }

      if (shouldNotify) {
        // 상태 업데이트
        await prisma.contract.update({
          where: { id: contract.id },
          data: {
            status: "EXPIRING",
            lastNotifiedAt: now,
          },
        });

        // 조직 관리자들에게 알림 생성
        for (const user of contract.organization.users) {
          const notification = await prisma.notification.create({
            data: {
              userId: user.id,
              type: "CONTRACT_EXPIRING",
              title: "계약 만료 예정",
              message: `${contract.customer.name}의 계약이 ${daysRemaining}일 후 만료됩니다.`,
              link: `/contracts`,
              isRead: false,
            },
          });
          notifications.push(notification);
        }
      }
    }

    // 만료된 계약 상태 업데이트
    await prisma.contract.updateMany({
      where: {
        endDate: {
          lt: today,
        },
        status: {
          not: "EXPIRED",
        },
      },
      data: {
        status: "EXPIRED",
      },
    });

    return NextResponse.json({
      message: "계약 만료 알림 처리 완료",
      notificationsCreated: notifications.length,
      contractsChecked: expiringContracts.length,
    });
  } catch (error: any) {
    console.error("Check expiring contracts error:", error);
    return NextResponse.json(
      { error: "계약 만료 알림 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
