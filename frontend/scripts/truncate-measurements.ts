import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.measurement.count();
  console.log(`[truncate] Measurement rows before: ${before}`);
  // Delete only measurements and staging raws; keep master data
  await prisma.$transaction([
    prisma.measurement.deleteMany({}),
    (prisma as any).stagingMeasurementRaw.deleteMany({})
  ]);
  const after = await prisma.measurement.count();
  console.log(`[truncate] Measurement rows after: ${after}`);
}

main().then(()=>prisma.$disconnect()).catch(async (e)=>{ console.error(e); await prisma.$disconnect(); process.exit(1); });
