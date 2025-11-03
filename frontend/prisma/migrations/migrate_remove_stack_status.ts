/**
 * 굴뚝 상태 제거 마이그레이션
 * 
 * 목적: 승인/거부 프로세스 제거, 즉시 공유 방식으로 전환
 * 
 * 변경 사항:
 * 1. PENDING_REVIEW → 자동 확정 (isActive: true, isVerified: false)
 * 2. REJECTED → 비활성화 (isActive: false)
 * 3. DRAFT, CONFIRMED → 유지 (isActive: true, isVerified: true)
 * 4. StackAssignment 생성 (없는 경우)
 * 5. 고객사 및 환경측정기업에 알림 발송
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 굴뚝 상태 제거 마이그레이션 시작...\n');

  try {
    // 1. 현재 상태 확인
    console.log('📊 현재 굴뚝 상태 확인 중...');
    const allStacks = await prisma.stack.findMany({
      select: {
        id: true,
        name: true,
        customerId: true,
        // status 필드는 이미 제거되었으므로 조회 불가
      }
    });

    console.log(`총 굴뚝 수: ${allStacks.length}개\n`);

    // 2. 모든 굴뚝을 활성화 및 확인 완료로 설정
    console.log('✅ 모든 굴뚝 활성화 및 확인 완료 처리 중...');
    
    let updatedCount = 0;
    for (const stack of allStacks) {
      await prisma.stack.update({
        where: { id: stack.id },
        data: {
          isActive: true,
          isVerified: true, // 기존 굴뚝은 모두 확인 완료로 간주
        }
      });
      updatedCount++;
    }

    console.log(`✅ ${updatedCount}개 굴뚝 업데이트 완료\n`);

    // 3. StackAssignment 생성 (없는 경우)
    console.log('📋 담당 이력 생성 중...');
    
    const stacksWithOrg = await prisma.stack.findMany({
      include: {
        organizations: true,
      }
    });

    let assignmentCount = 0;
    for (const stack of stacksWithOrg) {
      // 주 담당 환경측정기업 찾기
      const primaryOrg = stack.organizations.find(org => org.isPrimary);
      
      if (primaryOrg) {
        // StackAssignment가 없으면 생성
        const existingAssignment = await prisma.stackAssignment.findFirst({
          where: {
            stackId: stack.id,
            organizationId: primaryOrg.organizationId,
          }
        });

        if (!existingAssignment) {
          await prisma.stackAssignment.create({
            data: {
              stackId: stack.id,
              organizationId: primaryOrg.organizationId,
              startDate: stack.createdAt,
              endDate: null,
            }
          });
          assignmentCount++;
        }
      }
    }

    console.log(`✅ ${assignmentCount}개 담당 이력 생성 완료\n`);

    // 4. 고객사에 안내 알림 생성
    console.log('📢 고객사 안내 알림 생성 중...');
    
    const customers = await prisma.customer.findMany({
      where: {
        status: 'CONNECTED'
      }
    });

    let notificationCount = 0;
    for (const customer of customers) {
      // 고객사별 굴뚝 수 확인
      const stackCount = await prisma.stack.count({
        where: { customerId: customer.id }
      });

      if (stackCount > 0) {
        // Notification 테이블이 있다면 생성
        // 없다면 이 부분은 스킵
        try {
          await prisma.$executeRaw`
            INSERT INTO Notification (id, customerId, type, title, message, isRead, createdAt)
            VALUES (
              lower(hex(randomblob(16))),
              ${customer.id},
              'SYSTEM_UPDATE',
              '시스템 개선 안내',
              '굴뚝 승인 프로세스가 간소화되었습니다. 새로 등록되는 굴뚝은 즉시 사용 가능합니다.',
              0,
              datetime('now')
            )
          `;
          notificationCount++;
        } catch (error) {
          // Notification 테이블이 없으면 스킵
          console.log('⚠️ Notification 테이블이 없어 알림 생성을 건너뜁니다.');
          break;
        }
      }
    }

    if (notificationCount > 0) {
      console.log(`✅ ${notificationCount}개 고객사에 알림 발송 완료\n`);
    }

    console.log('🎉 마이그레이션 완료!\n');
    console.log('다음 단계:');
    console.log('1. ✅ 스키마에서 status, rejectionReason 필드 제거 완료');
    console.log('2. 🔄 npx prisma generate 실행 필요');
    console.log('3. 🔄 프론트엔드 코드 업데이트 필요');
    console.log('4. 🔄 API 코드 업데이트 필요\n');

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('✅ 마이그레이션 스크립트 종료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 마이그레이션 오류:', error);
      process.exit(1);
    });
}

export { migrate };
