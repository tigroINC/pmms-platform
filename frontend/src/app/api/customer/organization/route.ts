import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 고객사 조직 정보 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증되지 않았습니다" }, { status: 401 });
    }

    const user = session.user as any;
    
    // 세션에서 customerId 가져오기 또는 사용자 정보에서 조회
    let customerId = user.customerId;
    
    if (!customerId && user.email) {
      // 세션에 customerId가 없으면 DB에서 사용자 정보 조회
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { customerId: true },
      });
      customerId = dbUser?.customerId;
    }

    if (!customerId) {
      return NextResponse.json({ error: "고객사 정보가 없습니다" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: "고객사를 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json({ organization: customer });
  } catch (error) {
    console.error("GET /api/customer/organization error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

// PATCH: 고객사 조직 정보 수정
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증되지 않았습니다" }, { status: 401 });
    }

    const user = session.user as any;
    
    // 세션에서 customerId 가져오기 또는 사용자 정보에서 조회
    let customerId = user.customerId;
    
    if (!customerId && user.email) {
      // 세션에 customerId가 없으면 DB에서 사용자 정보 조회
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { customerId: true },
      });
      customerId = dbUser?.customerId;
    }

    if (!customerId) {
      return NextResponse.json({ error: "고객사 정보가 없습니다" }, { status: 400 });
    }

    const body = await request.json();
    const { name, businessNumber, corporateNumber, representative, address, businessType, industry, siteType, siteCategory } = body;

    // 기존 데이터 조회 (변경 사항 추적용)
    const currentCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    // 고객사 정보 업데이트 (존재하는 필드만)
    const updateData: any = {};
    const changes: string[] = [];
    
    if (name !== undefined && name !== currentCustomer?.name) {
      updateData.name = name;
      changes.push(`회사명: ${currentCustomer?.name} → ${name}`);
    }
    if (body.businessNumber !== undefined && body.businessNumber !== currentCustomer?.businessNumber) {
      updateData.businessNumber = body.businessNumber;
      changes.push(`사업자번호: ${currentCustomer?.businessNumber || '없음'} → ${body.businessNumber}`);
    }
    if (body.corporateNumber !== undefined && body.corporateNumber !== currentCustomer?.corporateNumber) {
      updateData.corporateNumber = body.corporateNumber;
      changes.push(`법인등록번호: ${currentCustomer?.corporateNumber || '없음'} → ${body.corporateNumber}`);
    }
    if (body.representative !== undefined && body.representative !== currentCustomer?.representative) {
      updateData.representative = body.representative;
      changes.push(`대표자: ${currentCustomer?.representative || '없음'} → ${body.representative}`);
    }
    if (address !== undefined && address !== currentCustomer?.address) {
      updateData.address = address;
      changes.push(`주소: ${currentCustomer?.address || '없음'} → ${address}`);
    }
    if (businessType !== undefined && businessType !== currentCustomer?.businessType) {
      updateData.businessType = businessType;
      changes.push(`업태: ${currentCustomer?.businessType || '없음'} → ${businessType}`);
    }
    if (industry !== undefined && industry !== currentCustomer?.industry) {
      updateData.industry = industry;
      changes.push(`업종: ${currentCustomer?.industry || '없음'} → ${industry}`);
    }
    if (siteType !== undefined && siteType !== currentCustomer?.siteType) {
      updateData.siteType = siteType;
      changes.push(`사업장: ${currentCustomer?.siteType || '없음'} → ${siteType}`);
    }
    if (siteCategory !== undefined && siteCategory !== currentCustomer?.siteCategory) {
      updateData.siteCategory = siteCategory;
      changes.push(`사업장종별: ${currentCustomer?.siteCategory || '없음'} → ${siteCategory}`);
    }

    // 변경사항이 없으면 업데이트하지 않음
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        message: "변경된 내용이 없습니다",
        organization: currentCustomer 
      });
    }

    // 고객사가 직접 수정하는 경우 자동 확인 처리
    updateData.isVerified = true;
    updateData.lastModifiedBy = "CUSTOMER";
    updateData.lastModifiedAt = new Date();

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
    });

    // 해당 고객사와 거래하는 모든 환경측정기업의 관리자에게 알림 발송
    try {
      console.log("고객사 정보 수정 알림 발송 시작, customerId:", customerId);
      
      const relatedStacks = await prisma.stack.findMany({
        where: { customerId: customerId },
        include: {
          organizations: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  users: {
                    where: {
                      role: { in: ["ORG_ADMIN", "SUPER_ADMIN"] },
                    },
                    select: { 
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      console.log("관련 굴뚝 수:", relatedStacks.length);

      const notifiedAdmins = new Set<string>();

      for (const stack of relatedStacks) {
        console.log("굴뚝:", stack.name, "담당 환경측정기업 수:", stack.organizations.length);
        
        for (const stackOrg of stack.organizations) {
          if (stackOrg.organization) {
            console.log("환경측정기업:", stackOrg.organization.name, "관리자 수:", stackOrg.organization.users.length);
            
            for (const admin of stackOrg.organization.users) {
              if (!notifiedAdmins.has(admin.id)) {
                console.log("알림 발송 대상:", admin.name, admin.email);
                
                const changeMessage = changes.length > 0 
                  ? `${name || currentCustomer?.name} 고객사가 조직 정보를 수정했습니다.\n변경 내역: ${changes.join(', ')}`
                  : `${name || currentCustomer?.name} 고객사가 조직 정보를 수정했습니다.`;
                
                await prisma.notification.create({
                  data: {
                    userId: admin.id,
                    type: "CUSTOMER_INFO_UPDATED_BY_CUSTOMER",
                    title: "고객사 정보 수정",
                    message: changeMessage,
                    customerId: customerId,
                  },
                });
                
                console.log("알림 생성 완료:", admin.id);
                notifiedAdmins.add(admin.id);
              }
            }
          }
        }
      }
      
      console.log("총 알림 발송 수:", notifiedAdmins.size);
    } catch (notificationError) {
      console.error("알림 발송 실패:", notificationError);
      // 알림 실패해도 업데이트는 성공으로 처리
    }

    return NextResponse.json({ 
      message: "조직 정보가 수정되었습니다",
      organization: updatedCustomer 
    });
  } catch (error) {
    console.error("PATCH /api/customer/organization error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
