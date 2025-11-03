import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 계약 만료 체크 및 알림 생성 (Cron Job용)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // 시스템 관리자만 실행 가능 (또는 Cron Job 전용 토큰 사용)
    if (session) {
      const userRole = (session.user as any).role;
      if (userRole !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
      }
    }

    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 승인된 연결 중 계약 종료일이 있는 것들
    const connections = await prisma.customerOrganization.findMany({
      where: {
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
                status: "APPROVED",
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    const notifications = {
      thirtyDays: 0,
      sevenDays: 0,
      expiry: 0,
    };

    for (const connection of connections) {
      if (!connection.contractEndDate) continue;

      const endDate = new Date(connection.contractEndDate);
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      // 30일 전 알림
      if (daysUntilExpiry <= 30 && daysUntilExpiry > 7 && !connection.notified30Days) {
        await prisma.customerOrganization.update({
          where: { id: connection.id },
          data: { notified30Days: true },
        });
        notifications.thirtyDays++;

        // TODO: 실제 알림 생성 (이메일, 시스템 알림 등)
        console.log(`30일 전 알림: ${connection.organization.name} - ${connection.customer.name}`);
      }

      // 7일 전 알림
      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0 && !connection.notified7Days) {
        await prisma.customerOrganization.update({
          where: { id: connection.id },
          data: { notified7Days: true },
        });
        notifications.sevenDays++;

        console.log(`7일 전 알림: ${connection.organization.name} - ${connection.customer.name}`);
      }

      // 만료 당일 알림
      if (daysUntilExpiry <= 0 && !connection.notifiedExpiry) {
        await prisma.customerOrganization.update({
          where: { id: connection.id },
          data: { notifiedExpiry: true },
        });
        notifications.expiry++;

        console.log(`만료 당일 알림: ${connection.organization.name} - ${connection.customer.name}`);
      }
    }

    return NextResponse.json({
      message: "계약 만료 체크 완료",
      checked: connections.length,
      notifications,
    });
  } catch (error: any) {
    console.error("Contract expiry check error:", error);
    return NextResponse.json(
      { error: "계약 만료 체크 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
