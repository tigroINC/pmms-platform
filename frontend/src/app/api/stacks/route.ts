import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyStackCreatedByOrg } from "@/lib/notification-helper";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId") || undefined;
    const organizationId = searchParams.get("organizationId");
    const userRole = (session.user as any).role;
    const userOrgId = (session.user as any).organizationId;
    const userCustomerId = (session.user as any).customerId;

    const where: any = {};
    
    // customerId 필터
    if (customerId) {
      where.customerId = customerId;
    }

    // 고객사 사용자: 자사 굴뚝만 조회
    if (userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER") {
      where.customerId = userCustomerId;
    } else {
      // 환경측정기업 사용자: 조직 필터링 (내부 관리 + 연결된 고객사)
      const userId = (session.user as any).id;
      const effectiveOrgId = organizationId || userOrgId;
      
      if (userRole === "SUPER_ADMIN") {
        if (organizationId) {
          where.customer = {
            OR: [
              { createdBy: userId },
              {
                organizations: {
                  some: {
                    organizationId: organizationId,
                    status: "APPROVED"
                  }
                }
              }
            ]
          };
        }
      } else {
        // 일반 환경측정기업 사용자: 내부 관리 + 연결된 고객사
        where.customer = {
          OR: [
            { createdBy: userId },
            {
              organizations: {
                some: {
                  organizationId: effectiveOrgId,
                  status: "APPROVED"
                }
              }
            }
          ]
        };
      }
    }

    const stacks = await prisma.stack.findMany({
      where,
      orderBy: [{ customer: { code: "asc" } }, { code: "asc" }],
      include: { 
        customer: { 
          select: { 
            id: true, 
            name: true, 
            code: true, 
            isActive: true 
          } as any
        },
        organizations: {
          where: {
            status: "APPROVED"
          },
          include: {
            organization: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: { measurements: true }
        }
      },
    });

    // PENDING_REVIEW 상태 굴뚝의 draftCreatedBy 조직 정보 추가
    const data = await Promise.all(
      stacks.map(async (stack) => {
        let orgNames: string[] = [];

        // 1. StackOrganization에서 담당 환경측정회사
        if (stack.organizations && stack.organizations.length > 0) {
          orgNames = stack.organizations.map(o => o.organization.name);
        }

        // 2. draftCreatedBy가 있으면 해당 조직 추가 (StackOrganization 없어도)
        if (stack.draftCreatedBy && orgNames.length === 0) {
          const draftOrg = await prisma.organization.findUnique({
            where: { id: stack.draftCreatedBy },
            select: { name: true }
          });
          if (draftOrg) {
            orgNames.push(draftOrg.name);
          }
        }

        return {
          ...stack,
          organizationNames: orgNames
        };
      })
    );

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Get stacks error:", error);
    return NextResponse.json({ error: "굴뚝 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, name } = body || {};
    if (!customerId || !name) {
      return NextResponse.json({ error: "customerId and name are required" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const organizationId = (session.user as any).organizationId;
    
    const siteCode = body.siteCode || name;
    
    // 중복 체크 (같은 고객사 내에서 같은 siteCode)
    const existing = await prisma.stack.findFirst({
      where: { 
        customerId, 
        siteCode 
      },
    });
    if (existing) {
      return NextResponse.json({ error: "이미 존재하는 굴뚝번호입니다" }, { status: 400 });
    }
    
    const data: any = { 
      customerId, 
      name,
      siteCode,
      createdBy: userId,
    };
    
    if (body.code) data.code = body.code;
    if (body.fullName) data.fullName = body.fullName;
    if (body.siteName) data.siteName = body.siteName;
    if (body.facilityType) data.facilityType = body.facilityType;
    if (body.location) data.location = body.location;
    if (body.height !== undefined && body.height !== null && body.height !== "") {
      data.height = parseFloat(body.height);
    }
    if (body.diameter !== undefined && body.diameter !== null && body.diameter !== "") {
      data.diameter = parseFloat(body.diameter);
    }
    if (body.category) data.category = body.category;
    
    // 환경측정기업이 생성하는 경우
    if (userRole === "ORG_ADMIN" || userRole === "OPERATOR") {
      data.draftCreatedBy = organizationId;
      data.draftCreatedAt = new Date();
      data.isVerified = false; // 고객사 확인 필요
      data.status = "PENDING_REVIEW"; // isVerified: false와 동일
    } else {
      // 고객사가 직접 생성하는 경우
      data.isVerified = true;
      data.status = "CONFIRMED";
    }
    
    // 트랜잭션으로 Stack + StackOrganization 동시 생성
    const created = await prisma.$transaction(async (tx) => {
      const stack = await tx.stack.create({ data });
      
      // 환경측정기업이 생성한 경우 즉시 StackOrganization 생성
      if (organizationId && (userRole === "ORG_ADMIN" || userRole === "OPERATOR")) {
        await tx.stackOrganization.create({
          data: {
            stackId: stack.id,
            organizationId: organizationId,
            status: "APPROVED",
            isPrimary: true,
            requestedBy: userId,
            approvedBy: userId,
            approvedAt: new Date(),
          },
        });
      }
      
      return stack;
    });
    
    // 환경측정기업이 생성한 경우 고객사에 알림
    if ((userRole === "ORG_ADMIN" || userRole === "OPERATOR") && organizationId) {
      try {
        const org = await prisma.organization.findUnique({
          where: { id: organizationId },
          select: { name: true }
        });
        
        if (org) {
          await notifyStackCreatedByOrg({
            stackId: created.id,
            stackName: created.name,
            customerId: customerId,
            organizationName: org.name,
            internalCode: created.code || undefined,
          });
        }
      } catch (notifyError) {
        console.error("[POST /api/stacks] Notification error:", notifyError);
        // 알림 실패해도 생성은 성공
      }
    }
    
    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("Create stack error:", error);
    return NextResponse.json({ error: "굴뚝 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
