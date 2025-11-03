import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCSV } from "@/lib/csvParser";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const userRole = user.role;

    // SUPER_ADMIN, ORG_ADMIN만 허용
    if (userRole !== "SUPER_ADMIN" && userRole !== "ORG_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await req.json();
    const { csvText } = body;

    if (!csvText) {
      return NextResponse.json({ error: "CSV 데이터가 필요합니다." }, { status: 400 });
    }

    // CSV 파싱 (따옴표 처리 개선)
    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      return NextResponse.json({ error: "데이터가 없습니다." }, { status: 400 });
    }

    const header = rows[0].map((h: string) => h.replace(/^"|"/g, ""));
    const keyIdx = header.indexOf("항목코드");
    const nameIdx = header.indexOf("항목명(한글)");
    const englishNameIdx = header.indexOf("항목명(영문)");
    const unitIdx = header.indexOf("기본단위");
    const categoryIdx = header.indexOf("구분");
    const classificationIdx = header.indexOf("항목분류");
    const limitIdx = header.indexOf("허용기준값(기본)");

    if (keyIdx === -1 || nameIdx === -1 || unitIdx === -1 || limitIdx === -1) {
      return NextResponse.json({ error: "필수 컬럼 '항목코드', '항목명(한글)', '기본단위', '허용기준값(기본)'이 필요합니다." }, { status: 400 });
    }


    let successCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].map((c: string) => c.replace(/^"|"$/g, ""));
      
      const key = cols[keyIdx]?.trim();
      const name = cols[nameIdx]?.trim();
      const englishName = englishNameIdx >= 0 ? cols[englishNameIdx]?.trim() : null;
      const unit = cols[unitIdx]?.trim();
      const category = categoryIdx >= 0 ? cols[categoryIdx]?.trim() : null;
      const classification = classificationIdx >= 0 ? cols[classificationIdx]?.trim() : null;
      const limit = cols[limitIdx] ? parseFloat(cols[limitIdx]) : 0;

      if (!key || !name || !unit || limit === undefined) {
        errors.push(`${i + 1}행: 항목코드, 항목명(한글), 기본단위, 허용기준값(기본)이 필요합니다.`);
        continue;
      }

      try {
        await prisma.item.upsert({
          where: { key },
          create: {
            key,
            name,
            englishName,
            unit,
            limit,
            category,
            classification,
            hasLimit: true,
            isActive: true,
            order: 0,
          },
          update: {
            name,
            englishName,
            unit,
            limit,
            category,
            classification,
          },
        });
        successCount++;
      } catch (error: any) {
        errors.push(`${i + 1}행: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      count: successCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `${successCount}건 등록 완료${errors.length > 0 ? `, ${errors.length}건 실패` : ""}`,
    });
  } catch (error: any) {
    console.error("Bulk measurement item upload error:", error);
    return NextResponse.json({ error: error.message || "업로드 실패" }, { status: 500 });
  }
}
