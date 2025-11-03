import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 임시 데이터 상세 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const temp = await prisma.measurementTemp.findUnique({
      where: { id: params.id },
      include: {
        customer: { select: { id: true, name: true } },
        stack: { select: { id: true, name: true, siteCode: true, siteName: true } },
      },
    });

    if (!temp) {
      return NextResponse.json({ error: "임시 데이터를 찾을 수 없습니다" }, { status: 404 });
    }

    // 권한 체크
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }

    // 본인 또는 관리자만 조회 가능
    const isOwner = temp.createdBy === user.id;
    const isAdmin = user.role === "ORG_ADMIN" || user.role === "SUPER_ADMIN";
    const isCustomerAdmin = user.role === "CUSTOMER_ADMIN" && user.customerId === temp.customerId;

    if (!isOwner && !isAdmin && !isCustomerAdmin) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // 응답 데이터 구성
    const measurements = JSON.parse(temp.measurements);
    const auxiliaryData = temp.auxiliaryData ? JSON.parse(temp.auxiliaryData) : null;

    return NextResponse.json({
      id: temp.id,
      tempId: temp.tempId,
      measurementDate: temp.measurementDate.toISOString(),
      customerId: temp.customerId,
      customerName: temp.customer?.name || "",
      stackId: temp.stackId,
      stackName: temp.stack?.siteName || temp.stack?.name || "",
      stackCode: temp.stack?.siteCode || temp.stack?.name || "",
      measurements,
      auxiliaryData,
      status: temp.status,
      createdBy: temp.createdBy,
      createdAt: temp.createdAt.toISOString(),
      updatedAt: temp.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error("임시 데이터 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 임시 데이터 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const temp = await prisma.measurementTemp.findUnique({
      where: { id: params.id },
    });

    if (!temp) {
      return NextResponse.json({ error: "임시 데이터를 찾을 수 없습니다" }, { status: 404 });
    }

    // 권한 체크
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }

    // 본인 또는 관리자만 삭제 가능
    const isOwner = temp.createdBy === user.id;
    const isAdmin = user.role === "ORG_ADMIN" || user.role === "SUPER_ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // 삭제
    await prisma.measurementTemp.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "삭제되었습니다",
    });
  } catch (error: any) {
    console.error("임시 데이터 삭제 오류:", error);
    return NextResponse.json(
      { error: error.message || "삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
