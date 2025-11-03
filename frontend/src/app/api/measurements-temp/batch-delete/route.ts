import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE: 임시 데이터 일괄 삭제
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "삭제할 항목을 선택해주세요" },
        { status: 400 }
      );
    }

    // 권한 체크
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }

    // 삭제 대상 조회
    const temps = await prisma.measurementTemp.findMany({
      where: { id: { in: ids } },
    });

    if (temps.length === 0) {
      return NextResponse.json({ error: "삭제할 데이터가 없습니다" }, { status: 404 });
    }

    // 권한 체크: 관리자는 모두 삭제 가능, 일반 사용자는 본인 데이터만
    const isAdmin = user.role === "ORG_ADMIN" || user.role === "SUPER_ADMIN";
    
    if (!isAdmin) {
      const notOwned = temps.filter((t) => t.createdBy !== user.id);
      if (notOwned.length > 0) {
        return NextResponse.json(
          { error: "본인이 생성한 데이터만 삭제할 수 있습니다" },
          { status: 403 }
        );
      }
    }

    // 일괄 삭제
    const result = await prisma.measurementTemp.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `${result.count}건이 삭제되었습니다`,
    });
  } catch (error: any) {
    console.error("일괄 삭제 오류:", error);
    return NextResponse.json(
      { error: error.message || "삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
