import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId") || undefined;
  const stackName = searchParams.get("stack") || undefined;

  const where: any = {};
  if (customerId || stackName) {
    where.measurements = {
      some: {
        ...(customerId ? { customerId } : {}),
        ...(stackName ? { stack: { name: stackName } } : {}),
      },
    };
  }

  const data = await prisma.item.findMany({ where, orderBy: [{ name: "asc" }, { key: "asc" }] });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, name, englishName, unit, limit, category, classification, analysisMethod, hasLimit } = body;

    // 필수 필드 검증
    if (!key || !name) {
      return NextResponse.json(
        { error: "항목코드, 항목명은 필수입니다." },
        { status: 400 }
      );
    }

    // 중복 체크
    const existing = await prisma.item.findUnique({
      where: { key },
    });

    if (existing) {
      return NextResponse.json(
        { error: "이미 존재하는 항목코드입니다." },
        { status: 400 }
      );
    }

    // 신규 측정항목 생성
    const newItem = await prisma.item.create({
      data: {
        key: key.trim(),
        name: name.trim(),
        englishName: englishName?.trim() || null,
        unit: unit?.trim() || null,
        limit: limit ? parseFloat(limit) : null,
        category: category || null,
        classification: classification?.trim() || null,
        analysisMethod: analysisMethod?.trim() || null,
        hasLimit: hasLimit !== false,
      },
    });

    return NextResponse.json({ data: newItem }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: error.message || "측정항목 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
