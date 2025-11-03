import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 권한 코드 정의
const PERMISSIONS = {
  // 고객사 관리
  CUSTOMER_CREATE: 'customer.create',
  CUSTOMER_READ: 'customer.read',
  CUSTOMER_UPDATE: 'customer.update',
  CUSTOMER_DELETE: 'customer.delete',
  
  // 측정 데이터
  MEASUREMENT_CREATE: 'measurement.create',
  MEASUREMENT_READ: 'measurement.read',
  MEASUREMENT_UPDATE: 'measurement.update',
  MEASUREMENT_DELETE: 'measurement.delete',
  
  // 보고서
  REPORT_CREATE: 'report.create',
  REPORT_READ: 'report.read',
  REPORT_UPDATE: 'report.update',
  REPORT_DELETE: 'report.delete',
  
  // 사용자 관리
  USER_CREATE: 'user.create',
  USER_READ: 'user.read',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  
  // 굴뚝 관리
  STACK_CREATE: 'stack.create',
  STACK_READ: 'stack.read',
  STACK_UPDATE: 'stack.update',
  STACK_DELETE: 'stack.delete',
  
  // 연결 관리
  CONNECTION_APPROVE: 'connection.approve',
  CONNECTION_REJECT: 'connection.reject',
  CONNECTION_DISCONNECT: 'connection.disconnect',
  
  // 조직 관리
  ORGANIZATION_UPDATE: 'organization.update',
  ORGANIZATION_SETTINGS: 'organization.settings',
  
  // 그룹 관리
  GROUP_READ: 'group.read',
  GROUP_UPDATE: 'group.update',
};

// 역할 템플릿 정의
const roleTemplates = [
  // === 환경측정업체 ===
  {
    code: 'org_admin',
    name: '환경측정업체 관리자',
    description: '고객사 관리, 직원 관리, 모든 데이터 조회',
    category: 'ORGANIZATION',
    permissions: [
      PERMISSIONS.CUSTOMER_CREATE,
      PERMISSIONS.CUSTOMER_READ,
      PERMISSIONS.CUSTOMER_UPDATE,
      PERMISSIONS.CUSTOMER_DELETE,
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.USER_DELETE,
      PERMISSIONS.MEASUREMENT_READ,
      PERMISSIONS.REPORT_READ,
      PERMISSIONS.REPORT_CREATE,
      PERMISSIONS.STACK_READ,
      PERMISSIONS.CONNECTION_APPROVE,
      PERMISSIONS.CONNECTION_REJECT,
      PERMISSIONS.CONNECTION_DISCONNECT,
      PERMISSIONS.ORGANIZATION_UPDATE,
      PERMISSIONS.ORGANIZATION_SETTINGS,
    ],
  },
  {
    code: 'org_operator',
    name: '환경측정업체 실무자',
    description: '담당 고객사 측정 데이터 입력 및 수정',
    category: 'ORGANIZATION',
    permissions: [
      PERMISSIONS.CUSTOMER_READ,
      PERMISSIONS.MEASUREMENT_CREATE,
      PERMISSIONS.MEASUREMENT_UPDATE,
      PERMISSIONS.MEASUREMENT_READ,
      PERMISSIONS.STACK_READ,
      PERMISSIONS.REPORT_READ,
    ],
  },
  {
    code: 'org_viewer',
    name: '환경측정업체 조회 전용',
    description: '모든 데이터 조회만 가능 (영업, 지원팀)',
    category: 'ORGANIZATION',
    permissions: [
      PERMISSIONS.CUSTOMER_READ,
      PERMISSIONS.MEASUREMENT_READ,
      PERMISSIONS.REPORT_READ,
      PERMISSIONS.STACK_READ,
    ],
  },
  
  // === 고객사 ===
  {
    code: 'customer_group_admin',
    name: '고객사 그룹 관리자',
    description: '그룹 전체 사업장 데이터 통합 조회 (법인 임원)',
    category: 'CUSTOMER',
    permissions: [
      PERMISSIONS.MEASUREMENT_READ,
      PERMISSIONS.REPORT_READ,
      PERMISSIONS.STACK_READ,
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.GROUP_READ,
      PERMISSIONS.CONNECTION_APPROVE,
    ],
  },
  {
    code: 'customer_site_admin',
    name: '고객사 사업장 관리자',
    description: '사업장 데이터 관리 및 연결 승인 (현장 책임자)',
    category: 'CUSTOMER',
    permissions: [
      PERMISSIONS.MEASUREMENT_READ,
      PERMISSIONS.REPORT_READ,
      PERMISSIONS.STACK_READ,
      PERMISSIONS.STACK_UPDATE,
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.CONNECTION_APPROVE,
    ],
  },
  {
    code: 'customer_user',
    name: '고객사 일반 사용자',
    description: '사업장 데이터 조회만 가능',
    category: 'CUSTOMER',
    permissions: [
      PERMISSIONS.MEASUREMENT_READ,
      PERMISSIONS.REPORT_READ,
      PERMISSIONS.STACK_READ,
    ],
  },
];

async function seedRoles() {
  console.log('🌱 Seeding role templates...');
  
  for (const template of roleTemplates) {
    const { permissions, ...templateData } = template;
    
    // 역할 템플릿 생성 (이미 있으면 업데이트)
    const roleTemplate = await prisma.roleTemplate.upsert({
      where: { code: template.code },
      update: {
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
      },
      create: {
        ...templateData,
        isSystem: true,
      },
    });
    
    console.log(`✅ Created/Updated role template: ${roleTemplate.name}`);
    
    // 기존 권한 삭제
    await prisma.roleTemplatePermission.deleteMany({
      where: { templateId: roleTemplate.id },
    });
    
    // 새 권한 추가
    for (const permissionCode of permissions) {
      await prisma.roleTemplatePermission.create({
        data: {
          templateId: roleTemplate.id,
          permissionCode,
        },
      });
    }
    
    console.log(`   📋 Added ${permissions.length} permissions`);
  }
  
  console.log('\n✨ Role templates seeding completed!');
}

async function main() {
  try {
    await seedRoles();
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
