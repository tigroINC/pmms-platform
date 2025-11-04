import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: 고객사 조직 정보 확인
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증되지 않았습니다" }, { status: 401 });
    }

    const user = session.user as any;
    let customerId = user.customerId;

    if (!customerId && user.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { customerId: true },
      });
      customerId = dbUser?.customerId;
    }

    if (!customerId) {
      return NextResponse.json({ error: "고객사 정보가 없습니다" }, { status: 400 });
    }

    // 확인 상태로 업데이트
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        isVerified: true,
        lastModifiedBy: "CUSTOMER",
        lastModifiedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      message: "조직 정보를 확인했습니다",
      organization: updatedCustomer
    });
  } catch (error) {
    console.error("POST /api/customer/organization/confirm error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
