import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'prisma', 'dev.db'));

// Customer 테이블 스키마 확인
console.log('=== Customer 테이블 스키마 ===');
const schema = db.prepare("PRAGMA table_info(Customer)").all();
console.log(schema);

// 데이터 확인
console.log('\n=== Customer 데이터 (3건) ===');
const customers = db.prepare("SELECT * FROM Customer LIMIT 3").all();
customers.forEach((c: any, idx: number) => {
  console.log(`\n[${idx + 1}] ${c.name}`);
  console.log(`  코드: ${c.code || '(없음)'}`);
  console.log(`  정식명칭: ${c.fullName || '(없음)'}`);
  console.log(`  사업장구분: ${c.siteType || '(없음)'}`);
  console.log(`  주소: ${c.address || '(없음)'}`);
  console.log(`  업종: ${c.industry || '(없음)'}`);
  console.log(`  사업장종별: ${c.siteCategory || '(없음)'}`);
});

db.close();
