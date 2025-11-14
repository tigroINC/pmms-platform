import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const tab = searchParams.get("tab"); // internal, connected, search
    const internal = searchParams.get("internal");
    const createdBy = searchParams.get("createdBy");
    const isPublic = searchParams.get("isPublic");
    const searchQuery = searchParams.get("q")?.trim() || ""; // 검색어
    const userRole = (session.user as any).role;
    const userOrgId = (session.user as any).organizationId;
    const userId = (session.user as any).id;

    console.log("[API /api/customers] userRole:", userRole);
    console.log("[API /api/customers] tab:", tab);
    console.log("[API /api/customers] organizationId from query:", organizationId);

    // 필터 조건
    const where: any = {};
    const effectiveOrgId = organizationId || userOrgId;

    // 탭별 필터링
    if (tab === "all") {
      // 전체: 조직의 모든 고객사 (내부 관리 + 연결됨)
      const orgUsers = await prisma.user.findMany({
        where: { organizationId: effectiveOrgId },
        select: { id: true }
      });
      const userIds = orgUsers.map(u => u.id);
      
      where.OR = [
        { createdBy: { in: userIds }, mergedIntoId: null },
        {
          organizations: {
            some: {
              organizationId: effectiveOrgId,
              status: "APPROVED"
            }
          }
        }
      ];
    } else if (tab === "internal") {
      // 내부: 내가 생성한 고객사만 (병합된 것 제외, 미연결만)
      const orgUsers = await prisma.user.findMany({
        where: { organizationId: effectiveOrgId },
        select: { id: true }
      });
      const userIds = orgUsers.map(u => u.id);
      
      where.createdBy = { in: userIds };
      where.mergedIntoId = null;
      // 연결 안 된 것만 (PENDING, APPROVED, REJECTED 제외, DISCONNECTED는 미연결로 간주)
      where.NOT = {
        organizations: {
          some: { 
            organizationId: effectiveOrgId,
            status: { in: ["PENDING", "APPROVED", "REJECTED"] }
          }
        }
      };
    } else if (tab === "connected") {
      // 연결된 고객사: APPROVED + PENDING + REJECTED 상태
      where.organizations = {
        some: {
          organizationId: effectiveOrgId,
          status: { in: ["APPROVED", "PENDING", "REJECTED"] }
        }
      };
    } else if (tab === "search") {
      // 고객사 검색: (관리자계정이 있는 가입 고객사) + (우리 조직이 내부 관리하는 고객사)
      console.log("[SEARCH DEBUG] searchQuery:", searchQuery);
      console.log("[SEARCH DEBUG] effectiveOrgId:", effectiveOrgId);

      // 검색어가 있을 때만 결과 표시
      if (searchQuery) {
        // 하이픈 제거한 버전
        const normalizedQuery = searchQuery.replace(/-/g, "");

        // 현재 조직의 사용자 목록 (내부 관리 고객사 createdBy 필터용)
        const orgUsers = await prisma.user.findMany({
          where: { organizationId: effectiveOrgId || undefined },
          select: { id: true },
        });
        const userIds = orgUsers.map((u) => u.id);

        const searchCondition = {
          OR: [
            { name: { contains: searchQuery } },
            { fullName: { contains: searchQuery } },
            { businessNumber: { contains: searchQuery } },
            { businessNumber: { contains: normalizedQuery } },
          ],
        };

        // 조건:
        // 1) 가입 고객사: 관리자계정(CUSTOMER_ADMIN)이 있는 고객사
        // 2) 내부 고객사: 우리 조직이 만들었고, 아직 우리 조직과 연결 안 된 고객사
        where.OR = [
          // 가입 고객사 후보: 관리자계정 있음
          {
            AND: [
              { mergedIntoId: null },
              {
                users: {
                  some: {
                    role: "CUSTOMER_ADMIN",
                  },
                },
              },
              searchCondition,
            ],
          },
          // 내부 관리 고객사 후보: 우리 조직이 만들었고 + 아직 연결 안 됨
          {
            AND: [
              { mergedIntoId: null },
              userIds.length
                ? { createdBy: { in: userIds } }
                : { createdBy: "__no_org_user__" },
              {
                NOT: {
                  organizations: {
                    some: { organizationId: effectiveOrgId || undefined },
                  },
                },
              },
              searchCondition,
            ],
          },
        ];
      } else {
        // 검색어 없으면 빈 결과 (검색 유도)
        where.id = "impossible-search-id";
      }

      console.log("[SEARCH DEBUG] Final where:", JSON.stringify(where, null, 2));
    }
    // 레거시 파라미터 지원
    else if (internal === "true") {
      where.isPublic = false;
      where.createdBy = createdBy || userId;
    } else if (isPublic === "true") {
      where.isPublic = true;
    }
    // 기존 로직: 연결된 고객사
    else {
      if (userRole === "SUPER_ADMIN") {
        if (organizationId) {
          where.organizations = {
            some: {
              organizationId: organizationId,
              status: "APPROVED"
            }
          };
        }
      } else {
        where.organizations = {
          some: {
            organizationId: userOrgId,
            status: "APPROVED"
          }
        };
      }
    }

    console.log("[SEARCH DEBUG] About to query with where:", JSON.stringify(where, null, 2));
    
    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        fullName: true,
        businessNumber: true,
        representative: true,
        address: true,
        businessType: true,
        industry: true,
        siteType: true,
        siteCategory: true,
        corporateNumber: true,
        isActive: true,
        isPublic: true,
        createdAt: true,
        createdBy: true,
        _count: { select: { stacks: true, measurements: true, users: true } },
        users: {
          where: { role: "CUSTOMER_ADMIN" },
          take: 1,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        organizations: {
          where:
            tab === "connected"
              ? { organizationId: effectiveOrgId, status: { in: ["APPROVED", "PENDING", "REJECTED"] } }
              : tab === "all"
              ? { organizationId: effectiveOrgId }
              : organizationId
              ? { organizationId }
              : userOrgId
              ? { organizationId: userOrgId }
              : undefined,
          select: {
            id: true,
            organizationId: true,
            status: true,
            requestedBy: true,
            customCode: true,
            proposedData: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
    
    console.log("[SEARCH DEBUG] Found customers:", customers.length);
    console.log("[SEARCH DEBUG] Customer details:", customers.map(c => ({ id: c.id, name: c.name, isPublic: c.isPublic, isActive: c.isActive })));
    
    return NextResponse.json({ customers });
  } catch (error: any) {
    console.error("[API /api/customers] ERROR:", error);
    console.error("[API /api/customers] ERROR message:", error.message);
    console.error("[API /api/customers] ERROR stack:", error.stack);
    return NextResponse.json({ 
      error: "고객사 조회 중 오류가 발생했습니다.",
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const name = (body?.name || "").trim();
    const businessNumber = (body?.businessNumber || "").trim();
    
    if (!name) {
      return NextResponse.json({ error: "고객사명은 필수입니다" }, { status: 400 });
    }

    if (!businessNumber) {
      return NextResponse.json({ error: "사업자등록번호는 필수입니다" }, { status: 400 });
    }

    // 현재 사용자의 조직 ID 가져오기
    const currentUser = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { organizationId: true },
    });

    if (!currentUser?.organizationId) {
      return NextResponse.json({ error: "조직 정보를 찾을 수 없습니다." }, { status: 400 });
    }

    // 관리자 계정은 초대링크를 통해 생성됨

    // 트랜잭션으로 고객사 + 관리자 계정 생성 (연결은 별도로)
    const result = await prisma.$transaction(async (tx) => {
      // 고객사 생성
      const customerData: any = { 
        name,
        businessNumber,
        createdBy: (session.user as any).id,  // 등록자 추적
        isPublic: false,  // 기본: 비공개 (내부 관리용)
      };
      if (body.code) customerData.code = body.code.trim();
      if (body.corporateNumber) customerData.corporateNumber = body.corporateNumber.trim();
      if (body.fullName) customerData.fullName = body.fullName.trim();
      if (body.representative) customerData.representative = body.representative.trim();
      if (body.siteType) customerData.siteType = body.siteType.trim();
      if (body.address) customerData.address = body.address.trim();
      if (body.businessType) customerData.businessType = body.businessType.trim();
      if (body.industry) customerData.industry = body.industry.trim();
      if (body.siteCategory) customerData.siteCategory = body.siteCategory.trim();
      if (body.groupId) customerData.groupId = body.groupId;
      
      const customer = await tx.customer.create({ data: customerData });

      // 고객사-조직 연결은 생성하지 않음 (나중에 연결 요청으로)
      // 관리자 계정은 초대링크를 통해 생성됨

      // 활동 로그
      await tx.activityLog.create({
        data: {
          userId: (session.user as any).id,
          action: "CREATE_CUSTOMER",
          target: "Customer",
          targetId: customer.id,
          details: JSON.stringify({
            customerName: name,
            businessNumber,
          }),
        },
      });

      return { customer };
    });

    console.log("Created customer:", result.customer);

    return NextResponse.json({ 
      ok: true, 
      data: result.customer,
      message: "고객사가 생성되었습니다. 초대 링크를 생성하여 관리자를 초대하세요.",
    }, { status: 201 });
  } catch (error: any) {
    console.error("Create customer error:", error);
    return NextResponse.json({ error: "고객사 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
