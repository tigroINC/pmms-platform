import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readFileText(p: string) {
  const buf = fs.readFileSync(p);
  // 월별 CSV는 CP949(EUC-KR) 인코딩이 많음
  const text = iconv.decode(buf, 'cp949');
  return text;
}

function extractCsvFromHeader(filePath: string, headerStartsWith: string, requiredTokens?: string[]) {
  const raw = readFileText(filePath);
  const lines = raw.split(/\r?\n/);
  let headerIndex = lines.findIndex((l) => l.includes(headerStartsWith));
  if (headerIndex === -1 && requiredTokens && requiredTokens.length) {
    headerIndex = lines.findIndex((l) => requiredTokens.every((t) => l.includes(t)));
  }
  if (headerIndex === -1) return [] as any[];

  const csvSlice = lines.slice(headerIndex).join('\n');
  const headerProbe = parse(csvSlice, {
    columns: false,
    skip_empty_lines: false,
    relax_column_count: true,
    relax_quotes: true,
    trim: true,
    bom: true,
  }) as string[][];

  if (!headerProbe.length) return [] as any[];
  const hHeader = (headerProbe[0] || []).map((s) => (s ?? '').toString().trim());
  const from_line = 2;
  const records = parse(csvSlice, {
    columns: hHeader.map((h) => h.trim()),
    from_line,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    trim: true,
    bom: true,
  });
  return records as any[];
}

function getField(obj: any, key: string) {
  const v = obj?.[key];
  return (v ?? '').toString().trim();
}

// Header normalization and flexible lookup
function normHeader(s: string) {
  return (s || '')
    .toString()
    .replace(/\(.+?\)/g, '') // drop parenthesis content
    .replace(/[\uFEFF]/g, '') // BOM
    .replace(/[％%]/g, '%')
    .replace(/[㎥]/g, 'M3')
    .replace(/[／/]/g, '/')
    .replace(/[℃]/g, 'C')
    .replace(/\s+/g, '')
    .toUpperCase();
}

function buildHeaderIndex(row: any) {
  const idx = new Map<string, string>();
  for (const k of Object.keys(row)) {
    idx.set(normHeader(k), k);
  }
  return idx;
}

function getByTokens(row: any, headerIdx: Map<string,string>, ...tokenGroups: string[][]) {
  for (const tokens of tokenGroups) {
    for (const [nk, orig] of Array.from(headerIdx.entries())) {
      let ok = true;
      for (const t of tokens.map(normHeader)) {
        if (!nk.includes(t)) { ok = false; break; }
      }
      if (ok) {
        return getField(row, orig);
      }
    }
  }
  return '';
}

function toISOFromYYYYMMDDhhmm(s: string): string | null {
  const m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!m) return null;
  const [_, Y, M, D, h, mi] = m;
  const dt = new Date(Number(Y), Number(M) - 1, Number(D), Number(h), Number(mi));
  return dt.toISOString();
}

function toNumber(s?: string): number | undefined {
  if (!s && s !== '0') return undefined;
  const n = Number(String(s).replace(/[^0-9.+-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

const WEATHER_CODE: Record<string, number> = { '맑음': 0, '흐림': 1, '비': 2, '눈': 3 };
const WIND_DIR_CODE: Record<string, number> = { '북':0, '북동':1, '동':2, '남동':3, '남':4, '남서':5, '서':6, '북서':7 };

async function main() {
  const docsDir = path.resolve(__dirname, '..', 'docs', 'requirements');
  const allFiles = fs.readdirSync(docsDir);
  const monthFiles = allFiles
    .filter((f) => /^(raw data 통합본.*|\d{1,2}월)\.CSV$/i.test(f))
    .map((f) => ({ name: f, full: path.join(docsDir, f) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // 보조항목 Item 미리 준비 (FK 충족)
  const AUX_ITEMS: Array<{ key: string; name: string; unit?: string }> = [
    { key: 'weather', name: '기상' },
    { key: 'temp', name: '기온', unit: '℃' },
    { key: 'humidity', name: '습도', unit: '％' },
    { key: 'pressure', name: '기압', unit: 'mmHg' },
    { key: 'wind_dir', name: '풍향' },
    { key: 'wind_speed', name: '풍속', unit: 'm/s' },
    { key: 'gas_velocity', name: '가스속도', unit: 'm/s' },
    { key: 'gas_temp', name: '가스온도', unit: '℃' },
    { key: 'moisture', name: '수분함량', unit: '％' },
    { key: 'o2_measured', name: '실측산소농도', unit: '％' },
    { key: 'o2_standard', name: '표준산소농도', unit: '％' },
    { key: 'flow_rate', name: '배출가스유량', unit: 'S㎥/min' },
  ];
  for (const it of AUX_ITEMS) {
    await prisma.item.upsert({
      where: { key: it.key },
      update: ({ name: it.name, unit: it.unit || '', limit: 0 } as any),
      create: ({ key: it.key, name: it.name, unit: it.unit || '', limit: 0 } as any),
    });
  }

  // 스택 매핑 미리 로드 (이름/별칭/정규화 -> {id, customerId})
  const stacks = await prisma.stack.findMany({ select: { id: true, customerId: true, name: true } });
  const aliases = await (prisma as any).stackAlias.findMany({ select: { stackId: true, alias: true } });
  const byId = new Map(stacks.map(s => [s.id, s] as const));
  const stackByKey = new Map<string, { id: string; customerId: string; name: string }>();
  const norm = (s: string) => (s||'').toString().trim().toUpperCase().replace(/\s+/g,'').replace(/[^A-Z0-9#-]/g,'');
  for (const s of stacks) {
    stackByKey.set(s.name, s);
    stackByKey.set(norm(s.name), s);
  }
  for (const a of aliases) {
    const s = byId.get(a.stackId);
    if (!s) continue;
    stackByKey.set(a.alias, s);
    stackByKey.set(norm(a.alias), s);
  }

  let created = 0;
  for (const mf of monthFiles) {
    const rows = extractCsvFromHeader(mf.full, '배출구명', ['배출구명','측정일자','오염물질']);
    for (const r of rows) {
      const hIdx = buildHeaderIndex(r);
      const stackName = getField(r, '배출구명');
      const whenStr = getField(r, '측정일자');
      if (!stackName || !whenStr) continue;
      const iso = toISOFromYYYYMMDDhhmm(whenStr);
      if (!iso) continue;
      const stack = stackByKey.get(stackName) || stackByKey.get(norm(stackName));
      if (!stack) continue;

      const inserts: { itemKey: string; value: number }[] = [];
      const weather = getByTokens(r, hIdx, ['기상']);
      if (weather && WEATHER_CODE[weather] !== undefined) inserts.push({ itemKey: 'weather', value: WEATHER_CODE[weather] });
      const temp = toNumber(getByTokens(r, hIdx, ['기온'], ['기온','C']));
      if (temp !== undefined) inserts.push({ itemKey: 'temp', value: temp });
      const humidity = toNumber(getByTokens(r, hIdx, ['습도']));
      if (humidity !== undefined) inserts.push({ itemKey: 'humidity', value: humidity });
      const pressure = toNumber(getByTokens(r, hIdx, ['기압'], ['기압','MMHG']));
      if (pressure !== undefined) inserts.push({ itemKey: 'pressure', value: pressure });
      const windDir = getByTokens(r, hIdx, ['풍향']);
      if (windDir && WIND_DIR_CODE[windDir] !== undefined) inserts.push({ itemKey: 'wind_dir', value: WIND_DIR_CODE[windDir] });
      const wind = toNumber(getByTokens(r, hIdx, ['풍속']));
      if (wind !== undefined) inserts.push({ itemKey: 'wind_speed', value: wind });
      const gasVel = toNumber(getByTokens(r, hIdx, ['가스','속도'], ['가스속도']));
      if (gasVel !== undefined) inserts.push({ itemKey: 'gas_velocity', value: gasVel });
      const gasTemp = toNumber(getByTokens(r, hIdx, ['가스','온도'], ['가스온도']));
      if (gasTemp !== undefined) inserts.push({ itemKey: 'gas_temp', value: gasTemp });
      const moisture = toNumber(getByTokens(r, hIdx, ['수분함량'], ['수분']));
      if (moisture !== undefined) inserts.push({ itemKey: 'moisture', value: moisture });
      const o2m = toNumber(getByTokens(r, hIdx, ['실측','산소','농도'], ['실측산소농도']));
      if (o2m !== undefined) inserts.push({ itemKey: 'o2_measured', value: o2m });
      const o2s = toNumber(getByTokens(r, hIdx, ['표준','산소','농도'], ['표준산소농도']));
      if (o2s !== undefined) inserts.push({ itemKey: 'o2_standard', value: o2s });
      const flow = toNumber(getByTokens(r, hIdx, ['배출가스','유량'], ['배출가스유량']));
      if (flow !== undefined) inserts.push({ itemKey: 'flow_rate', value: flow });

      if (!inserts.length) continue;
      const when = new Date(iso);
      for (const x of inserts) {
        const where = { stackId_itemKey_measuredAt: { stackId: stack.id, itemKey: x.itemKey, measuredAt: when } } as any;
        await prisma.measurement.upsert({
          where,
          update: ({ value: x.value } as any),
          create: ({ customerId: stack.customerId, stackId: stack.id, itemKey: x.itemKey, value: x.value, measuredAt: when } as any),
        });
        created += 1;
      }
    }
  }
  console.log(`Aux backfill completed. Created rows: ${created}`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
