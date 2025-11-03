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
      // 내부 관리: createdBy가 조직의 사용자
      // 연결됨: organizations에 연결
      const orgUsers = await prisma.user.findMany({
        where: { organizationId: effectiveOrgId },
        select: { id: true }
      });
      const orgUserIds = orgUsers.map(u => u.id);
      
      where.OR = [
        { createdBy: { in: orgUserIds } }, // 조직 사용자가 등록한 고객사
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
      // 내부 관리: 조직 사용자가 등록했지만 미연결
      const orgUsers = await prisma.user.findMany({
        where: { organizationId: effectiveOrgId },
        select: { id: true }
      });
      const orgUserIds = orgUsers.map(u => u.id);
      
      where.createdBy = { in: orgUserIds };
      where.NOT = {
        organizations: {
          some: {
            organizationId: effectiveOrgId,
            status: "APPROVED"
          }
        }
      };
    } else if (tab === "connected") {
      // 연결된 고객사: APPROVED 상태
      where.organizations = {
        some: {
          organizationId: effectiveOrgId,
          status: "APPROVED"
        }
      };
    } else if (tab === "search") {
      // 고객사 검색: 공개된 것 중 미연결
      where.isPublic = true;
      where.NOT = {
        organizations: {
          some: {
            organizationId: effectiveOrgId
          }
        }
      };
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

    const customers = await prisma.customer.findMany({
      where,
      include: { 
        _count: { select: { stacks: true, measurements: true, users: true } },
        users: {
          where: { role: "CUSTOMER_ADMIN" },
          take: 1,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        organizations: {
          where: organizationId ? { organizationId } : (userOrgId ? { organizationId: userOrgId } : undefined),
          select: {
            organizationId: true,
            status: true,
            customCode: true,
          }
        }
      },
      orderBy: { name: "asc" },
    });
    
    console.log("[API /api/customers] Query result count:", customers.length);
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
    
    // 고객사명 중복 체크
    const existingName = await prisma.customer.findUnique({ where: { name } });
    if (existingName) {
      return NextResponse.json({ error: "이미 존재하는 고객사명입니다" }, { status: 400 });
    }

    // 사업자등록번호 중복 체크
    const existingBusiness = await prisma.customer.findUnique({ where: { businessNumber } });
    if (existingBusiness) {
      return NextResponse.json({ error: "이미 등록된 사업자등록번호입니다" }, { status: 400 });
    }

    // 관리자 정보 검증
    if (!body.adminEmail || !body.adminPassword || !body.adminName || !body.adminPhone) {
      return NextResponse.json({ error: "고객사 관리자 정보는 필수입니다" }, { status: 400 });
    }

    // 이메일 중복 체크
    const existingUser = await prisma.user.findUnique({ where: { email: body.adminEmail } });
    if (existingUser) {
      return NextResponse.json({ error: "이미 사용 중인 이메일입니다" }, { status: 400 });
    }

    // 현재 사용자의 조직 ID 가져오기
    const currentUser = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { organizationId: true },
    });

    if (!currentUser?.organizationId) {
      return NextResponse.json({ error: "조직 정보를 찾을 수 없습니다." }, { status: 400 });
    }

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
      if (body.fullName) customerData.fullName = body.fullName.trim();
      if (body.siteType) customerData.siteType = body.siteType.trim();
      if (body.address) customerData.address = body.address.trim();
      if (body.industry) customerData.industry = body.industry.trim();
      if (body.siteCategory) customerData.siteCategory = body.siteCategory.trim();
      if (body.groupId) customerData.groupId = body.groupId;
      
      const customer = await tx.customer.create({ data: customerData });

      // 고객사-조직 연결은 생성하지 않음 (나중에 연결 요청으로)
      // 등록만 하고 연결은 별도 프로세스

      // 고객사 관리자 계정 생성 (선택적)
      let admin = null;
      if (body.createAdminAccount && body.adminEmail && body.adminPassword && body.adminName && body.adminPhone) {
        const hashedPassword = await bcrypt.hash(body.adminPassword, 10);
        admin = await tx.user.create({
          data: {
            email: body.adminEmail,
            password: hashedPassword,
            name: body.adminName,
            phone: body.adminPhone,
            role: "CUSTOMER_SITE_ADMIN",  // 사업장 관리자
            customerId: customer.id,
            companyName: name,
            status: "APPROVED",
            isActive: true,
            emailVerified: true,
          },
        });
      }

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
            adminEmail: body.adminEmail || null,
            createAdminAccount: !!admin,
          }),
        },
      });

      return { customer, admin };
    });

    return NextResponse.json({ 
      ok: true, 
      data: result.customer,
      message: "고객사 및 관리자 계정이 생성되었습니다.",
    }, { status: 201 });
  } catch (error: any) {
    console.error("Create customer error:", error);
    return NextResponse.json({ error: "고객사 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
