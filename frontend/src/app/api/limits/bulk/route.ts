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

    // CSV 파싱
    const rows = parseCSV(csvText);
    console.log("[배출허용기준 일괄업로드] 총 라인 수:", rows.length);
    
    if (rows.length < 2) {
      return NextResponse.json({ error: "데이터가 없습니다." }, { status: 400 });
    }

    const header = rows[0].map((h: string) => h.replace(/^"|"$/g, ""));
    console.log("[배출허용기준 일괄업로드] 헤더:", header);
    
    const scopeIdx = header.indexOf("범위");
    const customerCodeIdx = header.indexOf("고객사코드");
    const stackNameIdx = header.indexOf("굴뚝번호");
    const itemKeyIdx = header.indexOf("항목코드");
    const limitIdx = header.indexOf("설정기준");
    const regionIdx = header.indexOf("지역구분");
    
    console.log("[배출허용기준 일괄업로드] 컬럼 인덱스:", { 
      scopeIdx, customerCodeIdx, stackNameIdx, itemKeyIdx, limitIdx, regionIdx 
    });

    if (itemKeyIdx === -1 || limitIdx === -1) {
      return NextResponse.json({ 
        error: "필수 컬럼 '항목코드', '설정기준'이 필요합니다." 
      }, { status: 400 });
    }

    const organizationId = user.organizationId;
    if (!organizationId && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "조직 정보가 없습니다." }, { status: 400 });
    }

    let successCount = 0;
    const errors: string[] = [];
    const skipped: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].map((c: string) => c.replace(/^"|"$/g, ""));
      console.log(`[배출허용기준 일괄업로드] ${i}행 데이터:`, cols);
      
      const scope = scopeIdx >= 0 ? cols[scopeIdx] : "";
      const customerCode = customerCodeIdx >= 0 ? cols[customerCodeIdx] : "";
      const stackName = stackNameIdx >= 0 ? cols[stackNameIdx] : "";
      const itemKey = cols[itemKeyIdx];
      const limitValue = limitIdx >= 0 ? cols[limitIdx] : "";
      const region = regionIdx >= 0 ? cols[regionIdx] : undefined;

      if (!itemKey || !limitValue) {
        errors.push(`${i + 1}행: 항목코드와 설정기준이 필요합니다.`);
        console.log(`[배출허용기준 일괄업로드] ${i}행 스킵: 필수값 없음`);
        continue;
      }

      const limit = parseFloat(limitValue);
      if (isNaN(limit)) {
        errors.push(`${i + 1}행: 설정기준 '${limitValue}'는 숫자가 아닙니다.`);
        continue;
      }

      try {
        let customerId = "";
        let stackId = "";

        // 범위별 처리
        if (scope === "굴뚝별" || stackName) {
          // 굴뚝별 기준
          if (!customerCode || !stackName) {
            errors.push(`${i + 1}행: 굴뚝별 기준은 고객사코드와 굴뚝번호가 필요합니다.`);
            continue;
          }

          console.log(`[배출허용기준 일괄업로드] ${i + 1}행: 고객사코드 '${customerCode}' 검색 중... (organizationId: ${organizationId})`);
          
          // 고객사 찾기 (조직별 격리)
          const customer = await prisma.customer.findFirst({
            where: {
              code: customerCode,
              ...(organizationId
                ? {
                    organizations: {
                      some: {
                        organizationId,
                        status: "APPROVED",
                      },
                    },
                  }
                : {}),
            },
          });

          if (!customer) {
            errors.push(`${i + 1}행: 고객사코드 '${customerCode}'를 찾을 수 없습니다.`);
            continue;
          }

          console.log(`[배출허용기준 일괄업로드] ${i + 1}행: 고객사 찾음 (ID: ${customer.id})`);

          // 굴뚝 찾기
          const stack = await prisma.stack.findFirst({
            where: {
              customerId: customer.id,
              name: stackName,
            },
          });

          if (!stack) {
            errors.push(`${i + 1}행: 고객사 '${customerCode}'의 굴뚝 '${stackName}'을 찾을 수 없습니다.`);
            continue;
          }

          console.log(`[배출허용기준 일괄업로드] ${i + 1}행: 굴뚝 찾음 (ID: ${stack.id})`);
          
          customerId = customer.id;
          stackId = stack.id;

        } else if (scope === "고객사별" || customerCode) {
          // 고객사별 기준
          if (!customerCode) {
            errors.push(`${i + 1}행: 고객사별 기준은 고객사코드가 필요합니다.`);
            continue;
          }

          console.log(`[배출허용기준 일괄업로드] ${i + 1}행: 고객사코드 '${customerCode}' 검색 중... (organizationId: ${organizationId})`);
          
          const customer = await prisma.customer.findFirst({
            where: {
              code: customerCode,
              ...(organizationId
                ? {
                    organizations: {
                      some: {
                        organizationId,
                        status: "APPROVED",
                      },
                    },
                  }
                : {}),
            },
          });

          if (!customer) {
            errors.push(`${i + 1}행: 고객사코드 '${customerCode}'를 찾을 수 없습니다.`);
            continue;
          }

          console.log(`[배출허용기준 일괄업로드] ${i + 1}행: 고객사 찾음 (ID: ${customer.id})`);
          
          customerId = customer.id;
          stackId = "";

        } else {
          // 전체 기준 (공통기준)
          customerId = "";
          stackId = "";
        }

        // 중복 체크
        const existing = await prisma.emissionLimit.findFirst({
          where: {
            itemKey,
            customerId,
            stackId,
          },
        });

        if (existing) {
          const scopeText = stackId ? "굴뚝별" : customerId ? "고객사별" : "공통";
          skipped.push(`${i + 1}행: ${scopeText} 항목 '${itemKey}' 기준이 이미 존재합니다.`);
          console.log(`[배출허용기준 일괄업로드] ${i}행 스킵: 중복`);
          continue;
        }

        // 생성
        await prisma.emissionLimit.create({
          data: {
            itemKey,
            limit,
            region: region || null,
            customerId,
            stackId,
            createdBy: user.id,
            // isActive 필드는 스키마에 없으므로 제외
          },
        });

        console.log(`[배출허용기준 일괄업로드] ${i}행 성공`);
        successCount++;

      } catch (error: any) {
        console.error(`[배출허용기준 일괄업로드] ${i}행 실패:`, error.message);
        errors.push(`${i + 1}행: ${error.message}`);
      }
    }
    
    console.log(`[배출허용기준 일괄업로드] 완료 - 성공: ${successCount}, 스킵: ${skipped.length}, 실패: ${errors.length}`);

    const allMessages = [...errors, ...skipped];

    return NextResponse.json({
      success: true,
      count: successCount,
      errors: allMessages.length > 0 ? allMessages : undefined,
      message: `${successCount}건 등록 완료${allMessages.length > 0 ? `, ${allMessages.length}건 스킵/실패` : ""}`,
    });
  } catch (error: any) {
    console.error("Bulk emission limit upload error:", error);
    return NextResponse.json({ error: error.message || "업로드 실패" }, { status: 500 });
  }
}
