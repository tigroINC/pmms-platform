import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function minuteEpoch(d: Date) { return Math.floor(d.getTime() / 60000); }

async function main() {
  const total = await prisma.measurement.count();
  console.log(`[cleanup] total measurements: ${total}`);

  const take = 5000;
  let skip = 0;
  let processed = 0;
  const deleteBuffer: string[] = [];

  while (skip < total) {
    const rows = await prisma.measurement.findMany({
      skip, take,
      orderBy: { measuredAt: 'asc' },
      select: { id: true, stackId: true, itemKey: true, value: true, measuredAt: true },
    });
    skip += rows.length;
    processed += rows.length;

    const groups = new Map<string, { keepId: string; keepVal: number }>();
    for (const r of rows) {
      const m = minuteEpoch(new Date(r.measuredAt));
      const key = `${r.stackId}|${r.itemKey}|${m}`;
      const v = Number(r.value);
      const g = groups.get(key);
      if (!g) { groups.set(key, { keepId: r.id, keepVal: v }); continue; }
      // prefer non-zero; if both non-zero, keep max
      const curr = g.keepVal;
      const replace = (curr === 0 && v !== 0) || (v !== 0 && v > curr);
      if (replace) {
        deleteBuffer.push(g.keepId); // previous best becomes deletable
        g.keepId = r.id; g.keepVal = v;
      } else {
        deleteBuffer.push(r.id);
      }
    }

    if (deleteBuffer.length) {
      // delete in chunks of 500
      const chunkSize = 500;
      for (let i = 0; i < deleteBuffer.length; i += chunkSize) {
        const ids = deleteBuffer.slice(i, i + chunkSize);
        await prisma.measurement.deleteMany({ where: { id: { in: ids } } });
      }
      console.log(`[cleanup] deleted ${deleteBuffer.length} dups in this batch`);
      deleteBuffer.length = 0;
    }

    console.log(`[cleanup] processed ${processed}/${total}`);
  }

  console.log('[cleanup] done');
}

main().then(()=>prisma.$disconnect()).catch(async (e)=>{ console.error(e); await prisma.$disconnect(); process.exit(1); });
