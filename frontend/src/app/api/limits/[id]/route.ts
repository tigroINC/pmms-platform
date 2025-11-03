import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH: 배출허용기준 활성/비활성 토글
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { isActive } = body;

    // @ts-ignore
    const updated = await prisma.emissionLimit.update({
      where: { id: params.id },
      data: { isActive, updatedAt: new Date() },
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("Error updating emission limit:", error);
    return NextResponse.json(
      { error: error.message || "배출허용기준 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
