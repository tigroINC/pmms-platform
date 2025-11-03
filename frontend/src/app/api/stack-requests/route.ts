import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 굴뚝 등록 요청 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const organizationId = searchParams.get('organizationId');

    let whereClause: any = {};

    if (customerId) {
      whereClause.customerId = customerId;
    } else if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    const requests = await prisma.stackRequest.findMany({
      where: whereClause,
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
        stack: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // PENDING 먼저
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error("Get stack requests error:", error);
    return NextResponse.json(
      { error: "요청 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
