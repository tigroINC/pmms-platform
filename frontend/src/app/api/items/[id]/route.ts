import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const { key, name, englishName, unit, limit, category, classification, hasLimit, isActive, order, inputType, options } = body;

    // 기존 항목 확인
    const existing = await prisma.item.findUnique({
      where: { key: id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "존재하지 않는 측정항목입니다." },
        { status: 404 }
      );
    }

    // isActive만 변경하는 경우 (비활성화/활성화)
    if (isActive !== undefined && Object.keys(body).length === 1) {
      const updated = await prisma.item.update({
        where: { key: id },
        data: { isActive },
      });
      return NextResponse.json({ data: updated });
    }

    // order만 변경하는 경우
    if (order !== undefined && Object.keys(body).length === 1) {
      const updated = await prisma.item.update({
        where: { key: id },
        data: { order },
      });
      return NextResponse.json({ data: updated });
    }

    // 전체 필드 수정하는 경우
    // 필수 필드 검증
    if (!key || !name) {
      return NextResponse.json(
        { error: "항목코드, 항목명은 필수입니다." },
        { status: 400 }
      );
    }

    // 항목코드 중복 체크 (자신 제외)
    if (key !== existing.key) {
      const duplicate = await prisma.item.findUnique({
        where: { key },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "이미 존재하는 항목코드입니다." },
          { status: 400 }
        );
      }
    }

    // 측정항목 수정
    const updated = await prisma.item.update({
      where: { key: id },
      data: {
        key: key.trim(),
        name: name.trim(),
        englishName: englishName?.trim() || null,
        unit: unit?.trim() || existing.unit,
        limit: limit !== undefined ? parseFloat(limit) : existing.limit,
        category: category || existing.category,
        classification: classification?.trim() || existing.classification,
        hasLimit: hasLimit !== undefined ? hasLimit : existing.hasLimit,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        order: order !== undefined ? order : existing.order,
        inputType: inputType || existing.inputType,
        options: options !== undefined ? options : existing.options,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: error.message || "측정항목 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // 기존 항목 확인
    const existing = await prisma.item.findUnique({
      where: { key: id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "존재하지 않는 측정항목입니다." },
        { status: 404 }
      );
    }

    // 측정 데이터가 있는지 확인
    const measurementCount = await prisma.measurement.count({
      where: { itemKey: id },
    });

    if (measurementCount > 0) {
      return NextResponse.json(
        { error: "측정 데이터가 존재하는 항목은 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    // 측정항목 삭제
    await prisma.item.delete({
      where: { key: id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: error.message || "측정항목 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
