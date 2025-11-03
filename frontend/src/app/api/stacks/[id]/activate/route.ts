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
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "CUSTOMER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    await prisma.stack.update({
      where: { id: params.id },
      data: { isActive: true },
    });

    return NextResponse.json({ message: "활성화되었습니다." });
  } catch (error) {
    console.error("Activate stack error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
