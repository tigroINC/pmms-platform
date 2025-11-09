import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    await prisma.insightReport.update({
      where: { id: params.id },
      data: {
        sharedAt: new Date(),
        sharedBy: userId
      }
    });

    // TODO: 알림 생성 (5단계에서 구현)

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("인사이트 보고서 공유 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
