import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Tigro#2024$Secure!', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'tigrofin@gmail.com' },
    update: {},
    create: {
      email: 'tigrofin@gmail.com',
      password: hashedPassword,
      name: '티그로시스템관리자',
      role: 'SUPER_ADMIN',
      status: 'APPROVED',
      emailVerified: true,
      isActive: true
    }
  });

  console.log('✅ SUPER_ADMIN 계정 생성 완료');
  console.log('이메일: tigrofin@gmail.com');
  console.log('비밀번호: Tigro#2024$Secure!');
  console.log('역할: SUPER_ADMIN');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
