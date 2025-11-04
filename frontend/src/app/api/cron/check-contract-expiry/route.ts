import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 계약 만료 알림 체크 (매일 자정 실행)
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // 오늘 자정

    // 활성 계약이 있는 모든 연결 조회
    const connections = await prisma.customerOrganization.findMany({
      where: {
        isActive: true,
        status: "APPROVED",
        contractEndDate: {
          not: null,
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

    console.log(`[Cron] Found ${connections.length} connections to check`);
    const notifications = [];

    for (const conn of connections) {
      console.log(`[Cron] Checking ${conn.customer.name} - End: ${conn.contractEndDate}`);
      if (!conn.contractEndDate) continue;

      const endDate = new Date(conn.contractEndDate);
      endDate.setHours(0, 0, 0, 0);
      
      const diffTime = endDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      console.log(`[Cron] ${conn.customer.name} - Days remaining: ${daysRemaining}`);

      let notificationType: string | null = null;
      let shouldNotify = false;
      let flagToUpdate: string | null = null;

      // 30일 전 (1회)
      if (daysRemaining === 30 && !conn.notified30Days) {
        notificationType = "CONTRACT_EXPIRY_30";
        shouldNotify = true;
        flagToUpdate = "notified30Days";
      }
      // 21일 전 (1회)
      else if (daysRemaining === 21 && !conn.notified21Days) {
        notificationType = "CONTRACT_EXPIRY_21";
        shouldNotify = true;
        flagToUpdate = "notified21Days";
      }
      // 14일 전 (1회)
      else if (daysRemaining === 14 && !conn.notified14Days) {
        notificationType = "CONTRACT_EXPIRY_14";
        shouldNotify = true;
        flagToUpdate = "notified14Days";
      }
      // 7일 전 (1회)
      else if (daysRemaining === 7 && !conn.notified7Days) {
        notificationType = "CONTRACT_EXPIRY_7";
        shouldNotify = true;
        flagToUpdate = "notified7Days";
      }
      // 6일 전~1일 전 (매일)
      else if (daysRemaining >= 1 && daysRemaining <= 6) {
        notificationType = "CONTRACT_EXPIRY_DAILY";
        shouldNotify = true;
      }
      // 만료일 당일 (1회)
      else if (daysRemaining === 0 && !conn.notifiedExpiry) {
        notificationType = "CONTRACT_EXPIRED";
        shouldNotify = true;
        flagToUpdate = "notifiedExpiry";
      }

      if (shouldNotify && notificationType) {
        // 환경측정기업의 모든 ORG_ADMIN에게 알림 생성
        for (const user of conn.organization.users) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: notificationType,
              title: getNotificationTitle(notificationType, daysRemaining),
              message: getNotificationMessage(
                notificationType,
                conn.customer.name,
                daysRemaining,
                endDate
              ),
              customerId: conn.customerId,
              isRead: false,
            },
          });

          notifications.push({
            userId: user.id,
            type: notificationType,
            customer: conn.customer.name,
            daysRemaining,
          });
        }

        // 고객사의 모든 CUSTOMER_ADMIN에게도 알림 생성
        const customerAdmins = await prisma.user.findMany({
          where: {
            customerId: conn.customerId,
            role: "CUSTOMER_ADMIN",
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        for (const admin of customerAdmins) {
          await prisma.notification.create({
            data: {
              userId: admin.id,
              type: notificationType,
              title: getNotificationTitle(notificationType, daysRemaining),
              message: getNotificationMessageForCustomer(
                notificationType,
                conn.organization.name,
                daysRemaining,
                endDate
              ),
              customerId: conn.customerId,
              isRead: false,
            },
          });

          notifications.push({
            userId: admin.id,
            type: notificationType,
            customer: conn.customer.name,
            daysRemaining,
          });
        }

        // 플래그 업데이트 (1회성 알림만)
        if (flagToUpdate) {
          await prisma.customerOrganization.update({
            where: { id: conn.id },
            data: { [flagToUpdate]: true },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${notifications.length}개의 계약 만료 알림을 생성했습니다.`,
      notifications,
    });
  } catch (error: any) {
    console.error("Check contract expiry error:", error);
    return NextResponse.json(
      { error: "계약 만료 체크 중 오류가 발생했습니다.", details: error.message },
      { status: 500 }
    );
  }
}

function getNotificationTitle(type: string, daysRemaining: number): string {
  switch (type) {
    case "CONTRACT_EXPIRY_30":
      return "계약 만료 30일 전";
    case "CONTRACT_EXPIRY_21":
      return "계약 만료 21일 전";
    case "CONTRACT_EXPIRY_14":
      return "계약 만료 14일 전";
    case "CONTRACT_EXPIRY_7":
      return "계약 만료 7일 전";
    case "CONTRACT_EXPIRY_DAILY":
      return `계약 만료 ${daysRemaining}일 전`;
    case "CONTRACT_EXPIRED":
      return "계약 만료";
    default:
      return "계약 알림";
  }
}

function getNotificationMessage(
  type: string,
  customerName: string,
  daysRemaining: number,
  endDate: Date
): string {
  const formattedDate = endDate.toLocaleDateString("ko-KR");

  switch (type) {
    case "CONTRACT_EXPIRY_30":
    case "CONTRACT_EXPIRY_21":
    case "CONTRACT_EXPIRY_14":
    case "CONTRACT_EXPIRY_7":
    case "CONTRACT_EXPIRY_DAILY":
      return `${customerName}의 계약이 ${daysRemaining}일 후 만료됩니다. (만료일: ${formattedDate})`;
    case "CONTRACT_EXPIRED":
      return `${customerName}의 계약이 만료되었습니다. (만료일: ${formattedDate})`;
    default:
      return `${customerName}의 계약 알림`;
  }
}

function getNotificationMessageForCustomer(
  type: string,
  organizationName: string,
  daysRemaining: number,
  endDate: Date
): string {
  const formattedDate = endDate.toLocaleDateString("ko-KR");

  switch (type) {
    case "CONTRACT_EXPIRY_30":
    case "CONTRACT_EXPIRY_21":
    case "CONTRACT_EXPIRY_14":
    case "CONTRACT_EXPIRY_7":
    case "CONTRACT_EXPIRY_DAILY":
      return `${organizationName}과의 계약이 ${daysRemaining}일 후 만료됩니다. (만료일: ${formattedDate})`;
    case "CONTRACT_EXPIRED":
      return `${organizationName}과의 계약이 만료되었습니다. (만료일: ${formattedDate})`;
    default:
      return `${organizationName}과의 계약 알림`;
  }
}
