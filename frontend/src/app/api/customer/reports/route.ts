import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const stackId = searchParams.get("stackId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 고객사 사용자는 자신의 고객사에 속한 보고서만 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { customer: true },
    });

    if (!user?.customerId) {
      return NextResponse.json({ error: "Customer not found" }, { status: 403 });
    }

    const where: any = {
      customerId: user.customerId,
      status: "SHARED", // 고객사는 공유된 보고서만 조회
    };

    if (status) where.status = status;
    if (stackId) where.stackId = stackId;
    if (startDate || endDate) {
      where.measuredAt = {};
      if (startDate) where.measuredAt.gte = new Date(startDate);
      if (endDate) where.measuredAt.lte = new Date(endDate);
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, fullName: true } },
        stack: { select: { id: true, name: true, fullName: true } },
        createdByUser: {
          select: {
            name: true,
            organization: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: reports });
  } catch (error) {
    console.error("고객사 보고서 조회 오류:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
