import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const where: any = {};
    
    // customerId 필터
    if (customerId) {
      where.customerId = customerId;
    }

    // 조직 필터링 (내부 관리 + 연결된 고객사)
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
      // 일반 사용자: 내부 관리 + 연결된 고객사
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

    const data = await prisma.stack.findMany({
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
        _count: {
          select: { measurements: true }
        }
      },
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Get stacks error:", error);
    return NextResponse.json({ error: "굴뚝 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { customerId, name } = body || {};
  if (!customerId || !name) return NextResponse.json({ error: "customerId and name are required" }, { status: 400 });
  
  // 중복 체크 (같은 고객사 내에서 같은 이름)
  const existing = await prisma.stack.findFirst({
    where: { customerId, name },
  });
  if (existing) {
    return NextResponse.json({ error: "이미 존재하는 굴뚝번호입니다" }, { status: 400 });
  }
  
  const data: any = { customerId, name };
  if (body.code) data.code = body.code;
  if (body.fullName) data.fullName = body.fullName;
  if (body.facilityType) data.facilityType = body.facilityType;
  if (body.height !== undefined && body.height !== null && body.height !== "") {
    data.height = parseFloat(body.height);
  }
  if (body.diameter !== undefined && body.diameter !== null && body.diameter !== "") {
    data.diameter = parseFloat(body.diameter);
  }
  if (body.category) data.category = body.category;
  
  const created = await prisma.stack.create({ data });
  return NextResponse.json({ ok: true, data: created }, { status: 201 });
}
