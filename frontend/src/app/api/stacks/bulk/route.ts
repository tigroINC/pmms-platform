import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCSV } from "@/lib/csvParser";
import { notifyStackCreatedByOrg } from "@/lib/notification-helper";

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

    const header = rows[0].map((h: string) => h.replace(/^"|"$/g, ""));
    const customerCodeIdx = header.indexOf("고객사코드");
    const nameIdx = header.indexOf("굴뚝번호");
    const codeIdx = header.indexOf("굴뚝코드");
    const fullNameIdx = header.indexOf("굴뚝 정식 명칭");
    const facilityTypeIdx = header.indexOf("배출시설 종류");
    const locationIdx = header.indexOf("위치");
    const heightIdx = header.indexOf("굴뚝 높이(m)");
    const diameterIdx = header.indexOf("굴뚝 안지름(m)");
    const categoryIdx = header.indexOf("굴뚝 종별(종)");

    if (customerCodeIdx === -1 || nameIdx === -1) {
      return NextResponse.json({ error: "필수 컬럼 '고객사코드', '굴뚝번호'가 필요합니다." }, { status: 400 });
    }

    const organizationId = user.organizationId;
    if (!organizationId && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "조직 정보가 없습니다." }, { status: 400 });
    }

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].map((c: string) => c.replace(/^"|"$/g, ""));
      
      const customerCode = cols[customerCodeIdx];
      const name = cols[nameIdx];
      const code = codeIdx >= 0 ? cols[codeIdx] : undefined;
      const fullName = fullNameIdx >= 0 ? cols[fullNameIdx] : undefined;
      const facilityType = facilityTypeIdx >= 0 ? cols[facilityTypeIdx] : undefined;
      const location = locationIdx >= 0 ? cols[locationIdx] : undefined;
      const height = heightIdx >= 0 && cols[heightIdx] ? parseFloat(cols[heightIdx]) : undefined;
      const diameter = diameterIdx >= 0 && cols[diameterIdx] ? parseFloat(cols[diameterIdx]) : undefined;
      const category = categoryIdx >= 0 ? cols[categoryIdx] : undefined;

      if (!customerCode || !name) {
        errors.push(`${i + 1}행: 고객사코드와 굴뚝번호가 필요합니다.`);
        continue;
      }

      try {
        // 고객사 찾기 (조직별 격리)
        console.log(`[굴뚝 일괄업로드] ${i + 1}행: 고객사코드 '${customerCode}' 검색 중... (organizationId: ${organizationId})`);
        
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
          include: {
            organizations: {
              where: organizationId ? { organizationId } : undefined,
            },
          },
        });

        console.log(`[굴뚝 일괄업로드] ${i + 1}행: 고객사 검색 결과:`, customer ? `찾음 (ID: ${customer.id}, 연결: ${customer.organizations.length}개)` : '없음');

        if (!customer) {
          errors.push(`${i + 1}행: 고객사코드 '${customerCode}'를 찾을 수 없습니다.`);
          continue;
        }

        // 중복 체크 (고객사 내에서 굴뚝번호 중복 확인)
        const existing = await prisma.stack.findFirst({
          where: {
            customerId: customer.id,
            name,
          },
        });

        if (existing) {
          errors.push(`${i + 1}행: 고객사 '${customerCode}'에 이미 굴뚝번호 '${name}'이 존재합니다.`);
          continue;
        }

        const created = await prisma.stack.create({
          data: {
            name,
            siteCode: name, // siteCode = name (굴뚝번호)
            siteName: fullName || name, // siteName = 정식명칭 또는 굴뚝번호
            code: code || undefined,
            fullName: fullName || undefined,
            facilityType: facilityType || undefined,
            location: location || undefined,
            height: height || undefined,
            diameter: diameter || undefined,
            category: category || undefined,
            customerId: customer.id,
            isActive: true,
            draftCreatedBy: organizationId,
            draftCreatedAt: new Date(),
            isVerified: false,
            status: "PENDING_REVIEW",
          },
        });

        // StackOrganization 연결 생성
        if (organizationId) {
          await prisma.stackOrganization.create({
            data: {
              stackId: created.id,
              organizationId: organizationId,
              requestedBy: user.id,
            },
          });
        }

        // 고객사에 알림 전송
        if (organizationId) {
          try {
            const org = await prisma.organization.findUnique({
              where: { id: organizationId },
              select: { name: true }
            });
            
            if (org) {
              await notifyStackCreatedByOrg({
                stackId: created.id,
                stackName: created.name,
                customerId: customer.id,
                organizationName: org.name,
                internalCode: created.code || undefined,
              });
            }
          } catch (notifyError) {
            console.error(`[일괄업로드] ${i + 1}행 알림 전송 실패:`, notifyError);
          }
        }

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
    console.error("Bulk stack upload error:", error);
    return NextResponse.json({ error: error.message || "업로드 실패" }, { status: 500 });
  }
}
