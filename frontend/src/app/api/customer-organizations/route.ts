import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 고객사의 연결된 환경측정기업 목록 조회
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userCustomerId = (session.user as any).customerId;
    
    // 시스템 보기 모드 확인 (쿼리 파라미터로 전달)
    const { searchParams } = new URL(request.url);
    const viewAsCustomerId = searchParams.get("viewAsCustomer");
    const targetCustomerId = viewAsCustomerId || userCustomerId;
    
    const isCustomerUser = userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER";
    const isSuperAdminViewingAsCustomer = userRole === "SUPER_ADMIN" && !!viewAsCustomerId;

    if (!isCustomerUser && !isSuperAdminViewingAsCustomer) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    
    if (!targetCustomerId) {
      return NextResponse.json({ error: "고객사 정보가 없습니다." }, { status: 400 });
    }

    // 고객사의 연결된 환경측정기업 목록 조회 (APPROVED 상태만)
    const customerOrganizations = await prisma.customerOrganization.findMany({
      where: {
        customerId: targetCustomerId,
        status: "APPROVED",
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            businessNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const organizations = customerOrganizations.map((co) => ({
      id: co.organization.id,
      name: co.organization.name,
      businessNumber: co.organization.businessNumber,
      nickname: co.nickname,
    }));

    return NextResponse.json({ organizations });
  } catch (error: any) {
    console.error("Get customer organizations error:", error);
    return NextResponse.json(
      { error: "환경측정기업 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 연결 요청 생성 (환경측정기업 → 고객사)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, proposedData } = body;

    if (!customerId) {
      return NextResponse.json({ error: "고객사 ID는 필수입니다." }, { status: 400 });
    }

    // 현재 사용자의 조직 ID
    const currentUser = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { organizationId: true },
    });

    if (!currentUser?.organizationId) {
      return NextResponse.json({ error: "조직 정보를 찾을 수 없습니다." }, { status: 400 });
    }

    // PENDING 상태의 연결이 있는지 확인 (APPROVED는 중복 허용)
    const pendingConnection = await prisma.customerOrganization.findFirst({
      where: {
        customerId,
        organizationId: currentUser.organizationId,
        status: "PENDING",
      },
    });

    if (pendingConnection) {
      return NextResponse.json({ 
        error: "이미 연결 요청이 존재합니다." 
      }, { status: 400 });
    }
    
    // DISCONNECTED 상태의 연결 찾기 (재사용)
    const disconnectedConnection = await prisma.customerOrganization.findFirst({
      where: {
        customerId,
        organizationId: currentUser.organizationId,
        status: "DISCONNECTED",
      },
    });

    // 병합 연결인 경우 자동으로 내부 고객사 찾기
    let finalProposedData = proposedData;
    
    if (!proposedData?.internalCustomerId) {
      // proposedData에 internalCustomerId가 없으면 자동으로 찾기
      const targetCustomer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { businessNumber: true, siteType: true },
      });
      
      if (targetCustomer?.businessNumber) {
        // 같은 사업자번호의 내부 고객사 찾기
        const internalCustomer = await prisma.customer.findFirst({
          where: {
            businessNumber: targetCustomer.businessNumber,
            isPublic: false,
            mergedIntoId: null,
            createdBy: { in: await prisma.user.findMany({
              where: { organizationId: currentUser.organizationId },
              select: { id: true }
            }).then(users => users.map(u => u.id)) },
          },
        });
        
        if (internalCustomer) {
          finalProposedData = {
            ...proposedData,
            internalCustomerId: internalCustomer.id,
            code: internalCustomer.code,
            corporateNumber: internalCustomer.corporateNumber,
            fullName: internalCustomer.fullName,
            representative: internalCustomer.representative,
            siteType: internalCustomer.siteType,
            address: internalCustomer.address,
            businessType: internalCustomer.businessType,
            industry: internalCustomer.industry,
            siteCategory: internalCustomer.siteCategory,
          };
        }
      }
    }
    
    // 연결 요청 생성 또는 업데이트
    const connection = disconnectedConnection
      ? await prisma.customerOrganization.update({
          where: { id: disconnectedConnection.id },
          data: {
            status: "PENDING",
            requestedBy: "ORGANIZATION",
            proposedData: finalProposedData || null,
            isActive: true,
          },
        })
      : await prisma.customerOrganization.create({
          data: {
            customerId,
            organizationId: currentUser.organizationId,
            status: "PENDING",
            requestedBy: "ORGANIZATION",
            proposedData: finalProposedData || null,
          },
        });

    return NextResponse.json({ 
      ok: true, 
      data: connection,
      message: "연결 요청을 보냈습니다. 고객사 승인을 기다려주세요.",
    }, { status: 201 });
  } catch (error: any) {
    console.error("Create connection request error:", error);
    return NextResponse.json({ 
      error: "연결 요청 중 오류가 발생했습니다." 
    }, { status: 500 });
  }
}
