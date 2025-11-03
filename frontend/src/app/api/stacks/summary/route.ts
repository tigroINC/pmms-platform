import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/stacks/summary?customerId=...&itemKey=...&start=YYYY-MM-DD&end=YYYY-MM-DD
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId") || undefined;
  let itemKey = searchParams.get("itemKey") || undefined;
  const itemName = searchParams.get("itemName") || undefined;
  const start = searchParams.get("start") || undefined;
  const end = searchParams.get("end") || undefined;
  const debug = searchParams.get("debug") === "1";
  const debugStackId = searchParams.get("stackId") || undefined;
  let debugStackName = searchParams.get("stackName") || undefined;
  if (debugStackName && debugStackName.includes("%")) {
    try { debugStackName = decodeURIComponent(debugStackName); } catch {}
  }

  if (!customerId) return NextResponse.json({ error: "customerId is required" }, { status: 400 });
  if (!itemKey && itemName) {
    const found = await prisma.item.findFirst({ where: { name: itemName } });
    if (found) itemKey = found.key;
  }
  if (!itemKey) return NextResponse.json({ error: "itemKey (or itemName) is required" }, { status: 400 });

  // Fetch raw measurements for the period and customer, then aggregate per stack
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    ...(start || end ? { measuredAt: { gte: start ? new Date(start) : undefined, lte: end ? new Date(end) : undefined } } : {}),
    stack: { customerId, ...(debugStackId ? { id: debugStackId } : {}), ...(debugStackName ? { name: debugStackName } : {}) },
  };
  // item filter: allow itemKey OR item.name match (handles datasets where measurement.itemKey != items.key)
  if (itemKey && itemName) {
    where.OR = [ { itemKey }, { item: { name: itemName } } ];
  } else if (itemKey) {
    where.itemKey = itemKey;
  } else if (itemName) {
    where.item = { name: itemName };
  }

  const data = await prisma.measurement.findMany({
    where,
    include: { stack: { select: { id: true, name: true } }, item: { select: { limit: true, unit: true } } },
    orderBy: { measuredAt: "asc" },
  });

  // Dedup similar to measurements API
  const seen = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: typeof data = [] as any;
  for (const r of data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = r.measuredAt ? new Date(r.measuredAt as any) : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const minuteEpoch = d ? Math.floor(d.getTime() / 60000) : (r.measuredAt as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const numVal = Number((r as any).value);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const valKey = Number.isFinite(numVal) ? numVal.toFixed(3) : String((r as any).value);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stackKey = r.stack?.id || (r as any).stackId || r.stack?.name || "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const key = (r as any).id ? String((r as any).id) : `${stackKey}|${itemKey}|${minuteEpoch}|${valKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(r);
  }

  // Aggregate per stack
  type Agg = { stackId: string; stackName: string; avg: number; count: number; exceedCount: number; lastMeasuredAt?: Date | null };
  const map = new Map<string, Agg & { sum: number }>();
  const limit = rows[0]?.item?.limit ?? undefined;
  for (const r of rows) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sid = r.stack?.id as any as string;
    const sname = r.stack?.name || "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = Number((r as any).value) || 0;
    const prev = map.get(sid) || { stackId: sid, stackName: sname, avg: 0, count: 0, exceedCount: 0, lastMeasuredAt: null, sum: 0 };
    prev.count += 1;
    prev.sum += val;
    if (limit !== undefined && Number.isFinite(limit) && val > (limit as number)) prev.exceedCount += 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = r.measuredAt ? new Date(r.measuredAt as any) : null;
    if (!prev.lastMeasuredAt || (d && prev.lastMeasuredAt < d)) prev.lastMeasuredAt = d;
    map.set(sid, prev);
  }
  const result = Array.from(map.values()).map(v => ({
    stackId: v.stackId,
    stackName: v.stackName,
    avg: v.count ? Number((v.sum / v.count).toFixed(2)) : 0,
    count: v.count,
    exceedCount: v.exceedCount,
    lastMeasuredAt: v.lastMeasuredAt,
    limit: limit ?? null,
  })).sort((a, b) => b.avg - a.avg);

  if (debug && (debugStackId || debugStackName)) {
    const target = rows.filter(r =>
      (debugStackId && r.stack?.id === debugStackId) ||
      (debugStackName && r.stack?.name === debugStackName)
    );
    const groupsMap = new Map<number, { iso: string; count: number; zeroCount: number; values: Array<{ id?: string; value: number; measuredAt: string }>; }>();
    for (const r of target) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = r.measuredAt ? new Date(r.measuredAt as any) : null;
      if (!d) continue;
      const minute = Math.floor(d.getTime() / 60000);
      const key = minute;
      const bucket = groupsMap.get(key) || { iso: new Date(minute * 60000).toISOString(), count: 0, zeroCount: 0, values: [] };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val = Number((r as any).value) || 0;
      bucket.count += 1;
      if (val === 0) bucket.zeroCount += 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bucket.values.push({ id: (r as any).id, value: val, measuredAt: d.toISOString() });
      groupsMap.set(key, bucket);
    }
    const groups = Array.from(groupsMap.entries()).map(([minute, info]) => ({ minuteEpoch: minute, ...info })).sort((a, b) => a.minuteEpoch - b.minuteEpoch);
    return NextResponse.json({ data: result, debug: { stackId: debugStackId, stackName: debugStackName, itemKey, groups } });
  }

  return NextResponse.json({ data: result });
}
