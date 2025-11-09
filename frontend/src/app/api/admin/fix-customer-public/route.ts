import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 임시: 고객사 데이터 수정
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, customerId, mergedIntoId } = body;

    if (action === "setPublic") {
      const updated = await prisma.customer.update({
        where: { id: customerId },
        data: { isPublic: true },
      });
      return NextResponse.json({ ok: true, customer: updated });
    }

    if (action === "setMerged") {
      if (!customerId || !mergedIntoId) {
        return NextResponse.json({ error: "customerId와 mergedIntoId 필요" }, { status: 400 });
      }
      const updated = await prisma.customer.update({
        where: { id: customerId },
        data: { 
          mergedIntoId,
          mergedAt: new Date(),
        },
      });
      return NextResponse.json({ ok: true, customer: updated });
    }

    return NextResponse.json({ error: "action 필요 (setPublic, setMerged)" }, { status: 400 });
  } catch (error: any) {
    console.error("Fix customer error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
