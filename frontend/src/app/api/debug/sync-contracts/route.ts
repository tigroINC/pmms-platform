import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 기존 Contract 데이터를 CustomerOrganization에 동기화
export async function POST() {
  try {
    const contracts = await prisma.contract.findMany();

    let synced = 0;
    for (const contract of contracts) {
      await prisma.customerOrganization.updateMany({
        where: {
          customerId: contract.customerId,
          organizationId: contract.organizationId,
        },
        data: {
          contractStartDate: contract.startDate,
          contractEndDate: contract.endDate,
        },
      });
      synced++;
    }

    return NextResponse.json({
      success: true,
      message: `${synced}개의 계약을 동기화했습니다.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
