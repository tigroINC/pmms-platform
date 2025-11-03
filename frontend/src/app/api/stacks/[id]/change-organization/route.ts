import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { organizationId } = await request.json();
    const stackId = params.id;
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // 권한 체크: 고객사 관리자만
    if (userRole !== "CUSTOMER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 굴뚝 조회
    const stack = await prisma.stack.findUnique({
      where: { id: stackId },
      include: {
        customer: { select: { name: true } },
        organizations: {
          where: { status: "APPROVED" },
          include: { organization: { select: { name: true } } },
        },
      },
    });

    if (!stack) {
      return NextResponse.json({ error: "굴뚝을 찾을 수 없습니다." }, { status: 404 });
    }

    // 기존 담당사
    const oldOrganizations = stack.organizations;

    // 트랜잭션으로 처리
    await prisma.$transaction(async (tx) => {
      // 1. 기존 담당 관계 제거
      await tx.stackOrganization.deleteMany({
        where: { stackId },
      });

      // 2. 새 담당 관계 생성
      await tx.stackOrganization.create({
        data: {
          stackId,
          organizationId,
          status: "APPROVED",
          isPrimary: true,
          requestedBy: userId,
          approvedBy: userId,
          approvedAt: new Date(),
        },
      });

      // 3. 알림 생성 - 기존 담당사
      for (const oldOrg of oldOrganizations) {
        await tx.notification.create({
          data: {
            userId: "", // 조직 관리자에게 (별도 로직 필요)
            type: "STACK_ORGANIZATION_CHANGED",
            title: "굴뚝 담당 변경",
            message: `${stack.customer.name}의 굴뚝 "${stack.name}" 담당이 변경되었습니다.`,
            relatedId: stackId,
            relatedType: "STACK",
          },
        });
      }

      // 4. 알림 생성 - 신규 담당사
      await tx.notification.create({
        data: {
          userId: "", // 조직 관리자에게 (별도 로직 필요)
          type: "STACK_ORGANIZATION_ASSIGNED",
          title: "굴뚝 담당 지정",
          message: `${stack.customer.name}의 굴뚝 "${stack.name}" 담당으로 지정되었습니다.`,
          relatedId: stackId,
          relatedType: "STACK",
        },
      });
    });

    return NextResponse.json({ message: "담당 환경측정기업이 변경되었습니다." });
  } catch (error) {
    console.error("Change organization error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
