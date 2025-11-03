import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();

  try {
    // 업데이트할 데이터 구성
    const updateData: any = {};
    
    // 활성/비활성 토글
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    
    // 측정값 업데이트
    if (body.value !== undefined) updateData.value = body.value;
    if (body.measuredAt !== undefined) updateData.measuredAt = new Date(body.measuredAt);
    if (body.note !== undefined) updateData.note = body.note;
    
    // 수정 이력 추적 (선택적)
    if (body.editedBy) updateData.editedBy = body.editedBy;
    if (body.editReason) updateData.editReason = body.editReason;

    const updated = await prisma.measurement.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, code: true } },
        stack: { select: { id: true, name: true, code: true } },
        item: { select: { key: true, name: true, unit: true } },
      },
    });
    
    return NextResponse.json({ ok: true, data: updated });
  } catch (err: any) {
    console.error("Measurement update error:", err);
    return NextResponse.json(
      { error: err.message || "업데이트 실패" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    await prisma.measurement.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Measurement delete error:", err);
    return NextResponse.json(
      { error: err.message || "삭제 실패" },
      { status: 500 }
    );
  }
}
