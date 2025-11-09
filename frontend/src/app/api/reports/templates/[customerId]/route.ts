import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 보고서 템플릿 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerId } = params;

    const template = await prisma.reportTemplate.findUnique({
      where: { customerId },
    });

    return NextResponse.json({ data: template });
  } catch (error: any) {
    console.error("템플릿 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "템플릿 조회 실패" },
      { status: 500 }
    );
  }
}

// 보고서 템플릿 저장/수정
export async function POST(
  req: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const userRole = user.role;

    if (userRole !== "SUPER_ADMIN" && userRole !== "ORG_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { customerId } = params;
    const body = await req.json();

    const template = await prisma.reportTemplate.upsert({
      where: { customerId },
      create: {
        customerId,
        environmentalTech: body.environmentalTech,
        chiefTech: body.chiefTech,
        analyst: body.analyst,
        sampler: body.sampler,
      },
      update: {
        environmentalTech: body.environmentalTech,
        chiefTech: body.chiefTech,
        analyst: body.analyst,
        sampler: body.sampler,
      },
    });

    return NextResponse.json({ data: template });
  } catch (error: any) {
    console.error("템플릿 저장 오류:", error);
    return NextResponse.json(
      { error: error.message || "템플릿 저장 실패" },
      { status: 500 }
    );
  }
}
