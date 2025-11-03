// CommonJS seed script to avoid ts-node CLI quoting issues on Windows
require("ts-node/register/transpile-only");
const { PrismaClient } = require("@prisma/client");
const { MOCK_CUSTOMERS, MOCK_HISTORY, MOCK_ITEMS } = require("../src/data/mock");

const prisma = new PrismaClient();

async function main() {
  for (const c of MOCK_CUSTOMERS) {
    await prisma.customer.upsert({ where: { name: c.name }, update: {}, create: { name: c.name } });
  }
  for (const i of MOCK_ITEMS) {
    await prisma.item.upsert({
      where: { key: i.key },
      update: { name: i.name, unit: i.unit, limit: i.limit },
      create: { key: i.key, name: i.name, unit: i.unit, limit: i.limit },
    });
  }
  const customers = await prisma.customer.findMany();
  const getCustomerIdByName = (name) => customers.find((c) => c.name === name)?.id;
  const stackKey = new Set();
  for (const r of MOCK_HISTORY) {
    const customerName = r.customerId === "c1" ? "A회사" : r.customerId === "c2" ? "B회사" : r.customerId;
    const cid = getCustomerIdByName(customerName);
    const key = `${cid}::${r.stack}`;
    if (!stackKey.has(key)) {
      stackKey.add(key);
      await prisma.stack.upsert({
        where: { customerId_name: { customerId: cid, name: r.stack } },
        update: {},
        create: { customerId: cid, name: r.stack },
      });
    }
  }
  const stacks = await prisma.stack.findMany();
  const findStackId = (customerId, name) => stacks.find((s) => s.customerId === customerId && s.name === name)?.id;
  for (const r of MOCK_HISTORY) {
    const customerName = r.customerId === "c1" ? "A회사" : r.customerId === "c2" ? "B회사" : r.customerId;
    const customerId = getCustomerIdByName(customerName);
    const stackId = findStackId(customerId, r.stack);
    if (!customerId || !stackId) continue;
    await prisma.measurement.create({
      data: {
        customerId,
        stackId,
        itemKey: r.itemKey,
        value: r.value,
        measuredAt: new Date(r.measuredAt),
      },
    });
  }
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
