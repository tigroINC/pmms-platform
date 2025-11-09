import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 보고서 상세 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { id } = params;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        customer: true,
        stack: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "보고서를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (user.role === "CUSTOMER") {
      if (report.customerId !== user.customerId || report.status !== "SHARED") {
        return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
      }
    }

    return NextResponse.json({ data: report });
  } catch (error: any) {
    console.error("보고서 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "보고서 조회 실패" },
      { status: 500 }
    );
  }
}

// 보고서 수정 (새 버전 생성)
export async function PATCH(
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

    if (userRole !== "SUPER_ADMIN" && userRole !== "ORG_ADMIN" && userRole !== "ORG_USER") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    const existingReport = await prisma.report.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "보고서를 찾을 수 없습니다." }, { status: 404 });
    }

    // CONFIRMED 상태면 새 버전 생성
    if (existingReport.status === "CONFIRMED" || existingReport.status === "SHARED") {
      const newVersion = await prisma.report.create({
        data: {
          ...body,
          parentId: id,
          version: existingReport.version + 1,
          status: "DRAFT",
          createdBy: user.id,
          createdAt: new Date(),
        },
        include: {
          customer: true,
          stack: true,
        },
      });

      return NextResponse.json({ data: newVersion });
    }

    // DRAFT 상태면 덮어쓰기
    const { customer, stack, ...updateData } = body;
    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        customer: true,
        stack: true,
      },
    });

    return NextResponse.json({ data: updatedReport });
  } catch (error: any) {
    console.error("보고서 수정 오류:", error);
    return NextResponse.json(
      { error: error.message || "보고서 수정 실패" },
      { status: 500 }
    );
  }
}

// 보고서 삭제
export async function DELETE(
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

    await prisma.report.delete({
      where: { id },
    });

    return NextResponse.json({ message: "보고서가 삭제되었습니다." });
  } catch (error: any) {
    console.error("보고서 삭제 오류:", error);
    return NextResponse.json(
      { error: error.message || "보고서 삭제 실패" },
      { status: 500 }
    );
  }
}
