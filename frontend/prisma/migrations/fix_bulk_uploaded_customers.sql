-- 일괄업로드로 생성된 고객사의 조직 연결 제거
-- createdBy가 있고 isPublic=false인 고객사는 내부 관리용으로 간주

DELETE FROM "CustomerOrganization"
WHERE "customerId" IN (
  SELECT id FROM "Customer"
  WHERE "createdBy" IS NOT NULL
  AND "isPublic" = false
);

-- 확인용 쿼리 (실행 전 확인)
-- SELECT c.id, c.name, c.code, c."createdBy", c."isPublic", co.status
-- FROM "Customer" c
-- LEFT JOIN "CustomerOrganization" co ON c.id = co."customerId"
-- WHERE c."createdBy" IS NOT NULL AND c."isPublic" = false;
