// Railway 데이터베이스 연결 테스트
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('🔄 데이터베이스 연결 시도 중...');
    
    // 간단한 쿼리로 연결 테스트
    await prisma.$connect();
    console.log('✅ 데이터베이스 연결 성공!');
    
    // 테이블 확인
    const customers = await prisma.customer.count();
    console.log(`📊 고객사 수: ${customers}`);
    
    const users = await prisma.user.count();
    console.log(`👥 사용자 수: ${users}`);
    
  } catch (error) {
    console.error('❌ 연결 실패:', error.message);
    console.error('상세 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
