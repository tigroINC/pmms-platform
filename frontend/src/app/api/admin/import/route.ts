import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function splitCsvLine(line: string): string[] {
  // Simple CSV splitter handling quoted commas
  const out: string[] = [];
  let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === "," && !inQ) { out.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function parseYMDHM(s: string): Date | null {
  // Expect e.g. 202509041050
  const m = s?.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!m) return null;
  const [_, y, mm, d, hh, mi] = m;
  const dt = new Date(Number(y), Number(mm) - 1, Number(d), Number(hh), Number(mi));
  return isNaN(dt.getTime()) ? null : dt;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!file || !(file instanceof Blob)) return NextResponse.json({ error: "file is required" }, { status: 400 });
  const text = await file.text();
  const filename = ("name" in (file as any) ? (file as any).name : "uploaded.csv") as string;
  const lines = text.split(/\r?\n/).filter((l) => l !== "");
  if (lines.length < 1) return NextResponse.json({ error: "empty csv" }, { status: 400 });

  let created = 0;

  // 1) Generic typed CSV support (customer/stack/item/measurement,...)
  if (/^(customer|stack|item|measurement)(,|\s)/i.test(lines[0])) {
    for (const line of lines) {
      const cols = splitCsvLine(line);
      const type = cols[0]?.toLowerCase();
      try {
        if (type === "customer") {
          const name = cols[1]; if (!name) continue;
          await prisma.customer.upsert({ where: { name }, update: {}, create: { name } });
          created++;
        } else if (type === "stack") {
          const customerName = cols[1]; const name = cols[2];
          if (!customerName || !name) continue;
          const customer = await prisma.customer.findFirst({ where: { name: customerName } });
          if (!customer) continue;
          await prisma.stack.upsert({ where: { customerId_name: { customerId: customer.id, name } }, update: {}, create: { customerId: customer.id, name } });
          created++;
        } else if (type === "item") {
          const key = cols[1]; const name = cols[2]; const unit = cols[3]; const limit = Number(cols[4] ?? 0) || 0;
          if (!key || !name || !unit) continue;
          await prisma.item.upsert({ where: { key }, update: { name, unit, limit }, create: { key, name, unit, limit } });
          created++;
        } else if (type === "measurement") {
          const customerName = cols[1]; const stack = cols[2]; const itemKey = cols[3]; const value = Number(cols[4]); const measuredAt = new Date(cols[5]);
          const customer = await prisma.customer.findFirst({ where: { name: customerName } });
          if (!customer || !stack || !itemKey || !Number.isFinite(value) || isNaN(measuredAt.getTime())) continue;
          const stackRow = await prisma.stack.findFirst({ where: { customerId: customer.id, name: stack } });
          if (!stackRow) continue;
          await prisma.measurement.create({ data: { customerId: customer.id, stackId: stackRow.id, itemKey, value, measuredAt } });
          created++;
        }
      } catch {}
    }
    return NextResponse.json({ ok: true, summary: `${created} rows processed` });
  }

  // 2) Specific docs CSVs
  if (/고객사리스트|굴뚝/i.test(filename)) {
    // Columns example:
    // 0 업체(고객사명), 1 고객사 코드, 2 굴뚝 번호, 3 굴뚝코드, 4 굴뚝 정식 명칭, 5 배출시설 종류, 6 높이, 7 안지름, 8 종별
    for (let i = 0; i < lines.length; i++) {
      const cols = splitCsvLine(lines[i]);
      const first = (cols[0] || "").trim();
      if (!first || first === "업체" || first.startsWith("*")) continue; // skip headers/notes
      const customerName = first;
      const stackCode = (cols[2] || "").trim(); // 굴뚝 번호
      if (!customerName || !stackCode) continue;
      try {
        const customer = await prisma.customer.upsert({ where: { name: customerName }, update: {}, create: { name: customerName } });
        await prisma.stack.upsert({ where: { customerId_name: { customerId: customer.id, name: stackCode } }, update: {}, create: { customerId: customer.id, name: stackCode } });
        created++;
      } catch {}
    }
    return NextResponse.json({ ok: true, summary: `${created} stacks upserted` });
  }

  if (/측정항목표준리스트/i.test(filename)) {
    // Columns: 항목 코드, 항목명(한글), ..., 기본 단위, ...
    for (let i = 0; i < lines.length; i++) {
      const cols = splitCsvLine(lines[i]);
      if (!cols[0] || /항목 코드|3\.1/.test(cols[0])) continue;
      const code = cols[0].trim();
      const name = (cols[1] || code).trim();
      const unit = (cols[3] || "").trim() || "ppm";
      // Use Korean name as key to match measurement CSV pollutant names
      const key = name;
      try {
        await prisma.item.upsert({ where: { key }, update: { name, unit }, create: { key, name, unit, limit: 0 } });
        created++;
      } catch {}
    }
    return NextResponse.json({ ok: true, summary: `${created} items upserted` });
  }

  if (/raw data/i.test(filename)) {
    // Columns seen: 배출구명, 측정일자, ..., 오염물질, 농도, 배출허용기준농도
    for (let i = 0; i < lines.length; i++) {
      const cols = splitCsvLine(lines[i]);
      if (!cols[0] || /배출구명|\*/.test(cols[0])) continue;
      const stackCode = cols[0]?.trim();
      const ymdhm = (cols[1] || "").trim();
      const pollutant = (cols[14] || "").trim();
      const value = Number((cols[15] || "").trim());
      const dt = parseYMDHM(ymdhm);
      if (!stackCode || !pollutant || !Number.isFinite(value) || !dt) continue;
      try {
        const stack = await prisma.stack.findFirst({ where: { name: stackCode } });
        if (!stack) continue;
        await prisma.item.upsert({ where: { key: pollutant }, update: { name: pollutant }, create: { key: pollutant, name: pollutant, unit: "ppm", limit: 0 } });
        await prisma.measurement.create({ data: { customerId: stack.customerId, stackId: stack.id, itemKey: pollutant, value, measuredAt: dt } });
        created++;
      } catch {}
    }
    return NextResponse.json({ ok: true, summary: `${created} measurements inserted` });
  }

  return NextResponse.json({ error: `Unrecognized CSV format: ${filename}` }, { status: 400 });
}
