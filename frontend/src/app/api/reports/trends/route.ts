import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId") || undefined;
  const stack = searchParams.get("stack") || undefined;
  const itemKey = searchParams.get("itemKey") || undefined;
  const start = searchParams.get("start") || undefined;
  const end = searchParams.get("end") || undefined;

  if (!itemKey) return NextResponse.json({ error: "itemKey is required" }, { status: 400 });

  const where: any = { itemKey };
  if (customerId) where.customerId = customerId;
  if (start || end) where.measuredAt = { gte: start ? new Date(start) : undefined, lte: end ? new Date(end) : undefined };
  if (stack) where.stack = { name: stack };

  const list = await prisma.measurement.findMany({ where, include: { item: true }, orderBy: { measuredAt: "asc" } });

  // Build monthly buckets for requested period or for existing data span if not provided
  const first = start ? new Date(start) : (list[0] ? new Date(list[0].measuredAt) : new Date());
  const last = end ? new Date(end) : (list[list.length - 1] ? new Date(list[list.length - 1].measuredAt) : new Date());
  first.setDate(1);
  last.setDate(1);
  const labels: string[] = [];
  const keys: string[] = [];
  const buckets: Record<string, number[]> = {};
  const d = new Date(first);
  while (d <= last) {
    const k = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    keys.push(k);
    labels.push(`${d.getMonth() + 1}월`);
    buckets[k] = [];
    d.setMonth(d.getMonth() + 1);
  }
  for (const r of list) {
    const dt = new Date(r.measuredAt);
    const k = `${dt.getFullYear()}-${(dt.getMonth() + 1).toString().padStart(2, "0")}`;
    if (k in buckets) buckets[k].push(Number(r.value));
  }
  const data = keys.map((k) => {
    const arr = buckets[k];
    if (!arr || arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + b, 0);
    return Number((sum / arr.length).toFixed(1));
  });
  const limit = list[0]?.item?.limit ?? 0;

  return NextResponse.json({ data: { labels, data, limit } });
}
