import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 기존 굴뚝에 담당 추가 요청
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const userOrgId = (session.user as any).organizationId;

    // 권한 체크: 환경측정기업 사용자만
    if (userRole !== "ORG_ADMIN" && userRole !== "OPERATOR") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { stackId } = body;

    if (!stackId) {
      return NextResponse.json(
        { error: "굴뚝 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 굴뚝 조회
    const stack = await prisma.stack.findUnique({
      where: { id: stackId },
      include: {
        customer: true,
      },
    });

    if (!stack) {
      return NextResponse.json(
        { error: "굴뚝을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 고객사와 연결되어 있는지 확인
    const connection = await prisma.customerOrganization.findFirst({
      where: {
        customerId: stack.customerId,
        organizationId: userOrgId,
        status: "APPROVED",
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "해당 고객사와 연결되어 있지 않습니다." },
        { status: 403 }
      );
    }

    // 이미 담당 요청이 있는지 확인
    const existingAssignment = await prisma.stackOrganization.findUnique({
      where: {
        stackId_organizationId: {
          stackId: stackId,
          organizationId: userOrgId,
        },
      },
    });

    if (existingAssignment) {
      if (existingAssignment.status === "APPROVED") {
        return NextResponse.json(
          { error: "이미 담당하고 있는 굴뚝입니다." },
          { status: 400 }
        );
      } else if (existingAssignment.status === "PENDING") {
        return NextResponse.json(
          { error: "이미 담당 요청이 진행 중입니다." },
          { status: 400 }
        );
      }
    }

    // 담당 요청 생성
    const assignment = await prisma.stackOrganization.create({
      data: {
        stackId: stackId,
        organizationId: userOrgId,
        status: "PENDING",
        requestedBy: userId,
      },
      include: {
        stack: {
          select: {
            id: true,
            name: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
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

    // 활동 로그
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: "REQUEST_STACK_ASSIGNMENT",
        target: "StackOrganization",
        targetId: assignment.id,
        details: JSON.stringify({
          stackId: stackId,
          stackName: stack.name,
          customerId: stack.customerId,
        }),
      },
    });

    return NextResponse.json({
      message: "굴뚝 담당 요청이 전송되었습니다.",
      assignment,
    });
  } catch (error: any) {
    console.error("Request stack assignment error:", error);
    return NextResponse.json(
      { error: "굴뚝 담당 요청 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
