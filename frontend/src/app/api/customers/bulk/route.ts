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
    console.log("[고객사 일괄업로드 API] 총 라인 수:", rows.length);
    
    if (rows.length < 2) {
      return NextResponse.json({ error: "데이터가 없습니다." }, { status: 400 });
    }

    const header = rows[0].map((h: string) => h.replace(/^"|"$/g, ""));
    console.log("[고객사 일괄업로드 API] 헤더:", header);
    
    const codeIdx = header.indexOf("고객사코드");
    const nameIdx = header.indexOf("고객사명(약칭)");
    const fullNameIdx = header.indexOf("고객사명(정식)");
    const siteTypeIdx = header.indexOf("사업장구분");
    const addressIdx = header.indexOf("주소");
    const industryIdx = header.indexOf("업종");
    const siteCategoryIdx = header.indexOf("사업장종별");
    
    console.log("[고객사 일괄업로드 API] 컬럼 인덱스:", { codeIdx, nameIdx, fullNameIdx, siteTypeIdx, addressIdx, industryIdx, siteCategoryIdx });

    if (nameIdx === -1) {
      return NextResponse.json({ error: "필수 컬럼 '고객사명(약칭)'이 없습니다." }, { status: 400 });
    }

    const organizationId = user.organizationId;
    if (!organizationId && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "조직 정보가 없습니다." }, { status: 400 });
    }

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].map((c: string) => c.replace(/^"|"$/g, ""));
      console.log(`[고객사 일괄업로드 API] ${i}행 데이터:`, cols);
      
      const code = codeIdx >= 0 ? cols[codeIdx] : undefined;
      const name = cols[nameIdx];
      const fullName = fullNameIdx >= 0 ? cols[fullNameIdx] : undefined;
      const siteType = siteTypeIdx >= 0 ? cols[siteTypeIdx] : undefined;
      const address = addressIdx >= 0 ? cols[addressIdx] : undefined;
      const industry = industryIdx >= 0 ? cols[industryIdx] : undefined;
      const siteCategory = siteCategoryIdx >= 0 ? cols[siteCategoryIdx] : undefined;

      if (!name) {
        errors.push(`${i + 1}행: 고객사명(약칭)이 필요합니다.`);
        console.log(`[고객사 일괄업로드 API] ${i}행 스킵: 고객사명 없음`);
        continue;
      }

      // 중복 체크: 조직 내에서 고객사코드 또는 고객사명 중복 확인
      const whereCondition: any = organizationId 
        ? {
            AND: [
              {
                organizations: {
                  some: { organizationId }
                }
              },
              code 
                ? { code } // 코드가 있으면 코드로 체크
                : { name } // 코드가 없으면 이름으로 체크
            ]
          }
        : code 
          ? { code } // SUPER_ADMIN이고 코드가 있으면 코드로 체크
          : { name }; // SUPER_ADMIN이고 코드가 없으면 이름으로 체크

      const existing = await prisma.customer.findFirst({
        where: whereCondition,
      });

      if (existing) {
        const duplicateField = code ? `코드 '${code}'` : `고객사명 '${name}'`;
        console.log(`[고객사 일괄업로드 API] ${i}행 스킵: 이미 존재하는 ${duplicateField}`);
        continue;
      }

      try {
        // 내부 관리용으로만 등록 (조직 연결 없음)
        const newCustomer = await prisma.customer.create({
          data: {
            code: code || undefined,
            name,
            fullName: fullName || undefined,
            siteType: siteType || undefined,
            address: address || undefined,
            industry: industry || undefined,
            siteCategory: siteCategory || undefined,
            isActive: true,
            createdBy: user.id, // 등록자 추적
            isPublic: false, // 내부 관리용
            // 조직 연결은 생성하지 않음 (내부 관리 탭에서만 표시)
          },
        });
        console.log(`[고객사 일괄업로드 API] ${i}행 성공 (내부 관리용):`, newCustomer.id);
        successCount++;
      } catch (error: any) {
        console.error(`[고객사 일괄업로드 API] ${i}행 실패:`, error.message);
        errors.push(`${i + 1}행: ${error.message}`);
      }
    }
    
    console.log(`[고객사 일괄업로드 API] 완료 - 성공: ${successCount}, 실패: ${errors.length}`);

    return NextResponse.json({
      success: true,
      count: successCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `${successCount}건 등록 완료${errors.length > 0 ? `, ${errors.length}건 실패` : ""}`,
    });
  } catch (error: any) {
    console.error("Bulk customer upload error:", error);
    return NextResponse.json({ error: error.message || "업로드 실패" }, { status: 500 });
  }
}
