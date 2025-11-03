import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';
import iconv from 'iconv-lite';

const prisma = new PrismaClient();
// ESM-compatible __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readFileText(p: string) {
  const buf = fs.readFileSync(p);
  // Most of provided CSVs are CP949/EUC-KR encoded
  const text = iconv.decode(buf, 'cp949');
  return text;
}

function getField(obj: any, keyIncludes: string): string {
  if (!obj) return '';
  const k = Object.keys(obj).find((x) => x.includes(keyIncludes));
  const v = k ? obj[k] : '';
  return (v ?? '').toString().trim();
}

function normKey(s: string) {
  return (s || '')
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9#-]/g, '');
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
  // Try to use the previous physical line as a pre-header (e.g., contains '업체','고객사 코드')
  let preHeaderArr: string[] = [];
  if (headerIndex > 0) {
    const preLine = lines[headerIndex - 1];
    const preParsed = parse(preLine, { columns: false, relax_column_count: true, relax_quotes: true, trim: true, bom: true }) as string[][];
    preHeaderArr = (preParsed[0] || []).map((s) => (s ?? '').toString().trim());
  }
  const mergedHeader = hHeader.map((v, i) => (v && v.length ? v : (preHeaderArr[i] || '')));
  const from_line = 2; // body starts after the single header line we kept

  const records = parse(csvSlice, {
    columns: mergedHeader.map((h) => h.trim()),
    from_line,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    trim: true,
    bom: true,
  });
  return records as any[];
}

function normalizeItemName(name: string) {
  if (!name) return name;
  let base = name.replace(/\(.+?\)/g, '').trim();
  const map: Record<string, string> = {
    '포름알데히드': '폼알데하이드',
    '불소화합물': '플루오린화합물',
  };
  if (map[base]) base = map[base];
  return base;
}

async function main() {
  const docsDir = path.resolve(__dirname, '..', 'docs', 'requirements');
  const stacksCsv = path.join(docsDir, '굴뚝.CSV');
  const itemsCsv = path.join(docsDir, '측정항목표준리스트.CSV');
  // Collect monthly measurement CSVs (e.g., 'raw data 통합본1월.CSV' ... 'raw data 통합본9월.CSV')
  const allFiles = fs.readdirSync(docsDir);
  const monthFiles = allFiles
    .filter((f) => /^(raw data 통합본.*|\d{1,2}월)\.CSV$/i.test(f))
    .map((f) => ({
      name: f,
      full: path.join(docsDir, f),
      month: (() => {
        const m = f.match(/(\d{1,2})\s*월/i);
        return m ? parseInt(m[1], 10) : 999; // unknown month goes last
      })(),
    }))
    .sort((a, b) => a.month - b.month || a.name.localeCompare(b.name));
  const customersCsv = path.join(docsDir, '고객사리스트.CSV');
  // CLI args fallback for PowerShell env var issues
  const argv = process.argv.slice(2);
  const hasArg = (flag: string) => argv.some((a) => a === flag || a.startsWith(flag + '='));
  const getArgVal = (flag: string) => {
    const a = argv.find((x) => x.startsWith(flag + '='));
    return a ? a.split('=')[1] : undefined;
  };
  const ANALYZE_ONLY = (process.env.ANALYZE_ONLY === '1') || hasArg('--analyze');
  const MONTH_FILTER = process.env.MONTH_FILTER ? parseInt(process.env.MONTH_FILTER, 10) : (getArgVal('--month') ? parseInt(getArgVal('--month') as string, 10) : undefined);
  const SAMPLE_LOG = (process.env.SAMPLE_LOG === '1') || hasArg('--sample');

  // Get default organization (보아스환경기술)
  const defaultOrg = await prisma.organization.findFirst({
    where: { businessNumber: '123-45-67890' }
  });
  const defaultOrgId = defaultOrg?.id;
  console.log(`기본 조직: ${defaultOrg?.name} (${defaultOrgId})`);

  // Get admin user for createdBy
  const adminUser = await prisma.user.findFirst({
    where: {
      organizationId: defaultOrgId,
      role: 'ORG_ADMIN',
    },
  });
  const adminUserId = adminUser?.id;
  console.log(`Admin 사용자: ${adminUser?.name} (${adminUserId})`);

  // 1) Customers from 고객사리스트.CSV
  const customerRows = extractCsvFromHeader(customersCsv, '고객사 코드', ['고객사 코드', '고객사명']);
  const customerIdByName = new Map<string, string>();
  const customerIdByCode = new Map<string, string>();

  console.log(`고객사리스트.CSV에서 ${customerRows.length}개 행 읽음`);

  for (const r of customerRows) {
    // CSV 구조: 첫 컬럼이 업체(약칭), 나머지가 상세 정보
    const keys = Object.keys(r);
    let baseName = r[keys[0]]?.toString().trim(); // 첫 번째 컬럼 = 업체(약칭)
    const code = getField(r, '고객사 코드');
    const fullName = getField(r, '고객사명 (정식)') || getField(r, '고객사명(정식)');
    const shortName = getField(r, '고객사명 (약칭)') || getField(r, '고객사명(약칭)');
    const siteType = getField(r, '사업장 구분');
    const address = getField(r, '주소');
    const industry = getField(r, '업종');
    const siteCategory = getField(r, '사업장 종별');
    
    if (!baseName || baseName === '업체') continue; // 헤더 행 스킵

    // 사업장 구분이 있으면 name에 포함 (예: "한국보팍터미날 제1사업장")
    const name = siteType && siteType !== '-' ? `${baseName} ${siteType}` : baseName;

    console.log(`고객사 처리: ${name}, 코드: ${code}, 사업장구분: ${siteType}, 정식명: ${fullName}`);

    const c = await prisma.customer.upsert({
      where: { name },
      update: ({ code: code || undefined, fullName: fullName || undefined, siteType: siteType || undefined, address: address || undefined, industry: industry || undefined, siteCategory: siteCategory || undefined, isActive: true, contractStartDate: null, contractEndDate: null } as any),
      create: ({ name, code: code || undefined, fullName: fullName || undefined, siteType: siteType || undefined, address: address || undefined, industry: industry || undefined, siteCategory: siteCategory || undefined, createdBy: adminUserId, status: 'DRAFT', isActive: true, contractStartDate: null, contractEndDate: null } as any),
    });
    // 내부 관리 상태로 유지 (CustomerOrganization 관계 생성하지 않음)
    customerIdByName.set(name, c.id);
    customerIdByName.set(baseName, c.id); // 기본 이름으로도 매핑 (굴뚝 매칭용)
    if (code) customerIdByCode.set(code, c.id);
  }

  // 2) Stacks from 굴뚝.CSV
  let stackRows = extractCsvFromHeader(stacksCsv, '굴뚝 번호', ['굴뚝 번호', '굴뚝코드', '업체']);
  const stacksByName = new Map<string, { id: string; customerId: string }>();

  for (const r of stackRows) {
    const customerName = getField(r, '업체');
    const customerCode = getField(r, '고객사 코드');
    const stackName = getField(r, '굴뚝 번호');
    const stackCode = getField(r, '굴뚝코드');
    const stackFullName = getField(r, '굴뚝 정식 명칭');
    const facilityType = getField(r, '배출시설 종류');
    const height = parseFloat(getField(r, '높이')) || parseFloat(getField(r, '높이(m)')) || parseFloat(getField(r, '굴뚝 높이(m)')) || undefined as any;
    const diameter = parseFloat(getField(r, '안지름')) || parseFloat(getField(r, '안지름(m)')) || parseFloat(getField(r, '굴뚝 안지름(m)')) || undefined as any;
    const category = getField(r, '종별') || getField(r, '종별(종)') || getField(r, '굴뚝 종별(종)');
    if (!stackName) continue;

    let cid = customerIdByName.get(customerName) || customerIdByCode.get(customerCode);
    if (!cid) {
      // 고객사가 없으면 생성
      const c = await prisma.customer.upsert({
        where: { name: customerName || '기타' },
        update: {},
        create: { name: customerName || '기타', code: customerCode || undefined, createdBy: adminUserId, status: 'DRAFT', contractStartDate: null, contractEndDate: null },
      });
      // 내부 관리 상태로 유지 (CustomerOrganization 관계 생성하지 않음)
      cid = c.id;
      customerIdByName.set(customerName, cid);
      if (customerCode) customerIdByCode.set(customerCode, cid);
    }

    const s = await prisma.stack.upsert({
      where: { customerId_name: { customerId: cid, name: stackName } },
      update: ({ code: stackCode || undefined, fullName: stackFullName || undefined, facilityType: facilityType || undefined, height: height as any, diameter: diameter as any, category: category || undefined, siteCode: stackName, siteName: stackFullName || stackName } as any),
      create: ({ customerId: cid, name: stackName, siteCode: stackName, siteName: stackFullName || stackName, code: stackCode || undefined, fullName: stackFullName || undefined, facilityType: facilityType || undefined, height: height as any, diameter: diameter as any, category: category || undefined } as any),
      include: { customer: true },
    });
    const entry = { id: s.id, customerId: s.customerId };
    const keys = [stackName, stackCode, stackFullName].filter(Boolean) as string[];
    for (const k of keys) {
      stacksByName.set(k, entry);
      stacksByName.set(normKey(k), entry);
    }
    // create aliases for code/fullName
    if (stackCode) {
      await (prisma as any).stackAlias.upsert({
        where: { stackId_alias: { stackId: s.id, alias: stackCode } },
        update: ({ type: 'CODE' } as any),
        create: ({ stackId: s.id, alias: stackCode, type: 'CODE' } as any),
      });
    }
    if (stackFullName) {
      await (prisma as any).stackAlias.upsert({
        where: { stackId_alias: { stackId: s.id, alias: stackFullName } },
        update: ({ type: 'FULL_NAME' } as any),
        create: ({ stackId: s.id, alias: stackFullName, type: 'FULL_NAME' } as any),
      });
    }
  }

  // 2) Items from 측정항목표준리스트.CSV
  const itemRows = extractCsvFromHeader(itemsCsv, '항목 코드', ['항목 코드', '항목명', '기본 단위']);
  const itemByName = new Map<string, { key: string; name: string }>();

  for (const r of itemRows) {
    const key = (r['항목 코드'] || '').trim();
    const name = (r['항목명(한글)'] || '').trim();
    const englishName = (r['항목명(영문)'] || '').trim();
    const unit = (r['기본 단위'] || '').trim();
    const category = (r['항목 분류'] || '').trim();
    const hasLimitRaw = (r['허용기준여부'] || '').trim();
    const hasLimit = hasLimitRaw ? (hasLimitRaw.toUpperCase() === 'Y') : undefined;
    if (!key || !name) continue;
    await prisma.item.upsert({
      where: { key },
      update: ({ name, englishName: englishName || undefined, unit, limit: 0, category: category || undefined, hasLimit } as any),
      create: ({ key, name, englishName: englishName || undefined, unit, limit: 0, category: category || undefined, hasLimit } as any),
    });
    itemByName.set(name, { key, name });
    itemByName.set(normalizeItemName(name), { key, name });
  }

  // 3) Measurements from raw data (iterate over monthly files)
  let created = 0;
  let skipped = 0;
  const skipReasons: Record<string, number> = {};
  const unmatchedStacks = new Set<string>();
  // ANALYZE_ONLY already computed above

  for (const mf of monthFiles) {
    if (MONTH_FILTER && mf.month !== MONTH_FILTER) continue;
    const measurementsCsv = mf.full;
    const measRows = extractCsvFromHeader(measurementsCsv, '배출구명', ['배출구명', '측정일자', '오염물질']);
    let sampleLogged = 0;
    for (let idx = 0; idx < measRows.length; idx++) {
      const r = measRows[idx] as any;
    // ignore fully empty rows (commas only)
    const allEmpty = Object.values(r).every((v: any) => (v ?? '').toString().trim() === '');
    if (allEmpty) { continue; }
    // staging raw persist
    try {
      await (prisma as any).stagingMeasurementRaw.create({
        data: ({ sourceFile: path.basename(measurementsCsv), rowNo: idx + 1, rawJson: JSON.stringify(r) } as any),
      });
    } catch {}
    const stackName = getField(r, '배출구명');
    const whenStr = getField(r, '측정일자');
    const itemNameRaw = getField(r, '오염물질');
    // Prefer the pollutant concentration column: exclude oxygen/limit related columns
    let valueStr = '';
    const keys = Object.keys(r);
    const cand = keys.find((k) => k.includes('농도') && !k.includes('산소') && !k.includes('허용'))
      || keys.find((k) => k.trim() === '농도')
      || keys.find((k) => /농도\s*\(.*\)/.test(k));
    if (cand) {
      valueStr = (r as any)[cand] ?? '';
    } else {
      valueStr = getField(r, '농도');
    }
    const limitStr = getField(r, '배출허용기준농도');
    const limitCheck = getField(r, '배출허용기준체크');
    const weather = getField(r, '기상');
    const temperatureC = parseFloat(getField(r, '기온')) || undefined as any;
    const humidityPct = parseFloat(getField(r, '습도')) || undefined as any;
    const pressureMmHg = parseFloat(getField(r, '기압')) || undefined as any;
    const windDirection = getField(r, '풍향');
    const windSpeedMs = parseFloat(getField(r, '풍속')) || undefined as any;
    const gasVelocityMs = parseFloat(getField(r, '가스속도')) || undefined as any;
    const gasTempC = parseFloat(getField(r, '가스온도')) || undefined as any;
    const moisturePct = parseFloat(getField(r, '수분함량')) || undefined as any;
    const oxygenMeasuredPct = parseFloat(getField(r, '실측산소농도')) || undefined as any;
    const oxygenStdPct = parseFloat(getField(r, '표준산소농도')) || undefined as any;
    const flowSm3Min = parseFloat(getField(r, '배출가스유량')) || undefined as any;

    if (!stackName || !whenStr || !itemNameRaw) {
      skipped++; skipReasons['missing_required_field'] = (skipReasons['missing_required_field']||0)+1; continue; }

    let stack = stacksByName.get(stackName) || stacksByName.get(normKey(stackName));
    if (!stack) {
      // Auto-create under fallback customer '기타' if looks like a stack code
      if (/^#?[A-Z]\d{7,}$/.test(normKey(stackName))) {
        const fb = await prisma.customer.upsert({ where: { name: '기타' }, update: {}, create: { name: '기타', createdBy: adminUserId, status: 'DRAFT', contractStartDate: null, contractEndDate: null } });
        // 내부 관리 상태로 유지 (CustomerOrganization 관계 생성하지 않음)
        const created = await prisma.stack.upsert({
          where: { customerId_name: { customerId: fb.id, name: stackName } },
          update: {},
          create: { customerId: fb.id, name: stackName, siteCode: stackName, siteName: stackName },
        });
        stack = { id: created.id, customerId: created.customerId };
        stacksByName.set(stackName, stack);
        stacksByName.set(normKey(stackName), stack);
      }
    }
    if (!stack) { skipped++; skipReasons['stack_not_found'] = (skipReasons['stack_not_found']||0)+1; unmatchedStacks.add(stackName); continue; }

    // Item matching
    const norm = normalizeItemName(itemNameRaw);
    let itemRec = itemByName.get(norm) || itemByName.get(itemNameRaw);
    if (!itemRec) {
      // Create ad-hoc item
      const slug = norm.replace(/\s+/g, '-');
      await prisma.item.upsert({
        where: { key: slug },
        update: { name: norm },
        create: { key: slug, name: norm, unit: '', limit: 0 },
      });
      itemRec = { key: slug, name: norm };
      itemByName.set(norm, itemRec);
    }

    const value = parseFloat((valueStr ?? '').toString().replace(/,/g, ''));
    if (!isFinite(value)) { skipped++; skipReasons['value_not_numeric'] = (skipReasons['value_not_numeric']||0)+1; continue; }

    // Parse measuredAt: YYYYMMDDHHmm
    let measuredAt: Date | null = null;
    if (/^\d{12}$/.test(whenStr)) {
      const y = whenStr.slice(0, 4);
      const m = whenStr.slice(4, 6);
      const d = whenStr.slice(6, 8);
      const hh = whenStr.slice(8, 10);
      const mm = whenStr.slice(10, 12);
      measuredAt = new Date(`${y}-${m}-${d}T${hh}:${mm}:00`);
    } else if (/^\d{8}$/.test(whenStr)) {
      const y = whenStr.slice(0, 4);
      const m = whenStr.slice(4, 6);
      const d = whenStr.slice(6, 8);
      measuredAt = new Date(`${y}-${m}-${d}T00:00:00`);
    } else {
      measuredAt = new Date();
    }

    // Item limit update if present and not set yet
    const limit = parseFloat(limitStr.replace(/,/g, ''));

    if (SAMPLE_LOG && sampleLogged < 10) {
      console.log('[SAMPLE]', {
        month: mf.month,
        source: path.basename(measurementsCsv),
        row: idx + 1,
        stackName,
        itemNameRaw,
        value,
        valueColumn: cand || '농도',
        whenStr,
        measuredAt: measuredAt ? measuredAt.toISOString() : null,
      });
      sampleLogged++;
    }

    if (!ANALYZE_ONLY) {
      // Normalize to minute (drop seconds)
      const mAt = measuredAt ? new Date(Math.floor(measuredAt.getTime() / 60000) * 60000) : new Date();
      // One row per (stackId,itemKey,minute). Policy:
      // - Prefer non-zero over zero
      // - If both non-zero, keep max
      const whereKey = { stackId_itemKey_measuredAt: { stackId: stack.id, itemKey: itemRec.key, measuredAt: mAt } } as any;
      const existing = await prisma.measurement.findUnique({ where: whereKey }).catch(() => null);
      if (!existing) {
        await prisma.measurement.create({
          data: ({
            customerId: stack.customerId,
            stackId: stack.id,
            itemKey: itemRec.key,
            value,
            measuredAt: mAt,
            organizationId: defaultOrgId,
            weather,
            temperatureC: temperatureC as any,
            humidityPct: humidityPct as any,
            pressureMmHg: pressureMmHg as any,
            windDirection,
            windSpeedMs: windSpeedMs as any,
            gasVelocityMs: gasVelocityMs as any,
            gasTempC: gasTempC as any,
            moisturePct: moisturePct as any,
            oxygenMeasuredPct: oxygenMeasuredPct as any,
            oxygenStdPct: oxygenStdPct as any,
            flowSm3Min: flowSm3Min as any,
            limitAtMeasure: isFinite(limit) ? limit : undefined,
            limitCheck,
            measuringCompany: getField(r, '측정업체') || undefined,
          } as any),
        });
        created++;
      } else {
        const oldVal = Number(existing.value);
        const newVal = Number(value);
        const shouldReplace = (oldVal === 0 && newVal !== 0) || (newVal !== 0 && newVal > oldVal);
        if (shouldReplace) {
          await prisma.measurement.update({ where: whereKey, data: ({ value: newVal } as any) });
        } else {
          // keep existing; do not count as created
        }
      }
    }

    if (isFinite(limit)) {
      await prisma.item.update({
        where: { key: itemRec.key },
        data: { limit: { set: limit } },
      }).catch(() => undefined);
    }
  }
  }

  console.log(`Stacks: ${stacksByName.size}, Items: ${itemByName.size}, Measurements created: ${created}, Skipped: ${skipped}`);
  if (skipped) console.log('Skip reasons:', skipReasons);
  if (unmatchedStacks.size) console.log('Unmatched stack names:', Array.from(unmatchedStacks).slice(0, 20));
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
