import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 계약 수정
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const organizationId = (session.user as any).organizationId;

    // 권한 체크
    if (userRole !== "SUPER_ADMIN" && userRole !== "ORG_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { startDate, endDate, memo, status } = body;

    // 날짜 검증
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json({ error: "종료일은 시작일보다 이후여야 합니다." }, { status: 400 });
    }

    // 계약 수정
    const updateData: any = {};
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (memo !== undefined) updateData.memo = memo;
    if (status) updateData.status = status;

    const contract = await prisma.contract.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            businessNumber: true,
          },
        },
      },
    });

    return NextResponse.json({ contract });
  } catch (error: any) {
    console.error("Update contract error:", error);
    return NextResponse.json(
      { error: "계약 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 계약 삭제
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;

    // 권한 체크
    if (userRole !== "SUPER_ADMIN" && userRole !== "ORG_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    await prisma.contract.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "계약이 삭제되었습니다." });
  } catch (error: any) {
    console.error("Delete contract error:", error);
    return NextResponse.json(
      { error: "계약 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
