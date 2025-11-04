import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 디버깅용: 계약 및 CustomerOrganization 데이터 확인
export async function GET() {
  try {
    const contracts = await prisma.contract.findMany({
      include: {
        customer: { select: { name: true } },
        organization: { select: { name: true } },
      },
    });

    const customerOrgs = await prisma.customerOrganization.findMany({
      where: {
        contractEndDate: { not: null },
      },
      include: {
        customer: { select: { name: true } },
        organization: { select: { name: true } },
      },
    });

    return NextResponse.json({
      contracts: contracts.map(c => ({
        customer: c.customer.name,
        organization: c.organization.name,
        startDate: c.startDate,
        endDate: c.endDate,
      })),
      customerOrganizations: customerOrgs.map(co => ({
        customer: co.customer.name,
        organization: co.organization.name,
        contractStartDate: co.contractStartDate,
        contractEndDate: co.contractEndDate,
        notified7Days: co.notified7Days,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
