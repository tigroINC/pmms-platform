import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/communications/bulk-status
 * 일괄 상태 변경
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const user = session.user as any;
    const { ids, status } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "변경할 커뮤니케이션 ID를 선택해주세요" },
        { status: 400 }
      );
    }

    if (!status || !["PENDING", "COMPLETED", "REFERENCE"].includes(status)) {
      return NextResponse.json(
        { error: "유효하지 않은 상태입니다" },
        { status: 400 }
      );
    }

    // 권한 체크: 작성자 또는 담당자만
    const result = await prisma.communication.updateMany({
      where: {
        id: { in: ids },
        OR: [
          { createdById: user.id },
          { assignedToId: user.id }
        ],
        isDeleted: false
      },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      updated: result.count,
      failed: ids.length - result.count
    });
  } catch (error: any) {
    console.error("Bulk status change error:", error);
    return NextResponse.json(
      { error: "일괄 상태 변경 실패", details: error.message },
      { status: 500 }
    );
  }
}
