import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 신규 굴뚝 등록 요청
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
    const {
      customerId,
      stackName,
      stackCode,
      location,
      height,
      diameter,
      coordinates,
      description,
    } = body;

    if (!customerId || !stackName || !location) {
      return NextResponse.json(
        { error: "고객사, 굴뚝명, 위치는 필수입니다." },
        { status: 400 }
      );
    }

    // 고객사와 연결되어 있는지 확인
    const connection = await prisma.customerOrganization.findFirst({
      where: {
        customerId: customerId,
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

    // 굴뚝 등록 요청 생성
    const stackRequest = await prisma.stackRequest.create({
      data: {
        customerId: customerId,
        organizationId: userOrgId,
        requestType: "NEW_STACK",
        stackName: stackName,
        stackCode: stackCode,
        location: location,
        height: height,
        diameter: diameter,
        coordinates: coordinates,
        description: description,
        requestedBy: userId,
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

    // 활동 로그
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: "REQUEST_NEW_STACK",
        target: "StackRequest",
        targetId: stackRequest.id,
        details: JSON.stringify({
          customerId: customerId,
          stackName: stackName,
        }),
      },
    });

    return NextResponse.json({
      message: "굴뚝 등록 요청이 전송되었습니다.",
      stackRequest,
    });
  } catch (error: any) {
    console.error("Request new stack error:", error);
    return NextResponse.json(
      { error: "굴뚝 등록 요청 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
