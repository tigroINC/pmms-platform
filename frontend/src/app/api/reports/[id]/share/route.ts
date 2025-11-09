import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 보고서 고객 공유
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const userRole = user.role;

    if (userRole !== "SUPER_ADMIN" && userRole !== "ORG_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { id } = params;

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: "보고서를 찾을 수 없습니다." }, { status: 404 });
    }

    if (report.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "확정된 보고서만 공유할 수 있습니다." },
        { status: 400 }
      );
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status: "SHARED",
      },
      include: {
        customer: true,
        stack: true,
      },
    });

    return NextResponse.json({
      message: "보고서가 고객사와 공유되었습니다.",
      data: updatedReport,
    });
  } catch (error: any) {
    console.error("보고서 공유 오류:", error);
    return NextResponse.json(
      { error: error.message || "보고서 공유 실패" },
      { status: 500 }
    );
  }
}
