import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH: 배출허용기준 활성/비활성 토글
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    console.log("[PATCH /api/limits/[id]] params.id:", params.id);
    const body = await request.json();
    console.log("[PATCH /api/limits/[id]] body:", body);
    const { isActive } = body;

    // @ts-ignore
    const updated = await prisma.emissionLimit.update({
      where: { id: params.id },
      data: { isActive },
    });

    console.log("[PATCH /api/limits/[id]] updated:", updated);
    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("[PATCH /api/limits/[id]] Error:", error);
    console.error("[PATCH /api/limits/[id]] Error message:", error.message);
    console.error("[PATCH /api/limits/[id]] Error stack:", error.stack);
    return NextResponse.json(
      { error: error.message || "배출허용기준 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
