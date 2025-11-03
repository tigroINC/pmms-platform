import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPermissions() {
  console.log('🌱 Seeding permission system...');

  // 기본 역할 템플릿
  const roleTemplates = [
    // === 환경측정업체 ===
    {
      code: "org_admin",
      name: "환경측정업체 관리자",
      category: "ORGANIZATION",
      permissions: [
        "customer.*",
        "user.*",
        "measurement.*",
        "report.*",
        "stack.*",
        "item.*",
        "limit.*",
        "assignment.*"
      ]
    },
    {
      code: "operator",
      name: "환경측정업체 실무자",
      category: "ORGANIZATION",
      permissions: [
        "customer.read",
        "measurement.create",
        "measurement.update",
        "measurement.read",
        "stack.read",
        "item.read",
        "limit.read",
        "report.read"
      ]
    },
    
    // === 고객사 ===
    {
      code: "customer_admin",
      name: "고객사 관리자",
      category: "CUSTOMER",
      permissions: [
        "measurement.read",
        "report.read",
        "stack.update",
        "user.create",
        "user.update",
        "connection.approve",
        "measurement.comment",
        "alert.manage"
      ]
    },
    {
      code: "customer_user",
      name: "고객사 일반 사용자",
      category: "CUSTOMER",
      permissions: [
        "measurement.read",
        "report.read",
        "stack.read"
      ]
    }
  ];

  // 각 템플릿 생성
  for (const template of roleTemplates) {
    console.log(`  Creating template: ${template.name}`);
    
    const createdTemplate = await prisma.roleTemplate.upsert({
      where: { code: template.code },
      update: {
        name: template.name,
        category: template.category,
      },
      create: {
        code: template.code,
        name: template.name,
        category: template.category,
        isSystem: true,
      }
    });
    
    // 기존 권한 삭제
    await prisma.roleTemplatePermission.deleteMany({
      where: { templateId: createdTemplate.id }
    });
    
    // 권한 생성
    for (const permission of template.permissions) {
      await prisma.roleTemplatePermission.create({
        data: {
          templateId: createdTemplate.id,
          permissionCode: permission
        }
      });
    }
    
    console.log(`    ✓ ${template.permissions.length} permissions added`);
  }

  console.log('✅ Permission system seeded successfully!');
}

seedPermissions()
  .catch((e) => {
    console.error('❌ Error seeding permissions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
