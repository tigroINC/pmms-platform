import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId") || undefined;
  const stack = searchParams.get("stack") || undefined;
  const itemKey = searchParams.get("itemKey") || undefined;
  const start = searchParams.get("start") || undefined;
  const end = searchParams.get("end") || undefined;

  const where: any = {};
  if (customerId) where.customerId = customerId;
  if (itemKey) where.itemKey = itemKey;
  if (start || end) where.measuredAt = { gte: start ? new Date(start) : undefined, lte: end ? new Date(end) : undefined };
  if (stack) where.stack = { name: stack };

  const list = await prisma.measurement.findMany({ where, include: { item: true } });
  const totalCount = list.length;
  const now = new Date();
  const monthCount = list.filter((r: any) => {
    const dt = new Date(r.measuredAt);
    return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
  }).length;
  const exceed = list.filter((r: any) => r.item && typeof r.item.limit === "number" && Number(r.value) > r.item.limit).length;
  const avg = list.length ? Number((list.reduce((a: number, r: any) => a + Number(r.value), 0) / list.length).toFixed(1)) : 0;

  return NextResponse.json({ data: { totalCount, monthCount, exceed, avg } });
}
