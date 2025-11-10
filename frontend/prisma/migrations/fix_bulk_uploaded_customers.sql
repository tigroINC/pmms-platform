-- ?¼ê´„?…ë¡œ?œë¡œ ?ì„±??ê³ ê°?¬ì˜ ì¡°ì§ ?°ê²° ?œê±°
-- createdByê°€ ?ˆê³  isPublic=false??ê³ ê°?¬ëŠ” ?´ë? ê´€ë¦¬ìš©?¼ë¡œ ê°„ì£¼
DELETE FROM "CustomerOrganization"
WHERE "customerId" IN (
  SELECT id FROM "Customer"
  WHERE "createdBy" IS NOT NULL
  AND "isPublic" = false
);
-- ?•ì¸??ì¿¼ë¦¬ (?¤í–‰ ???•ì¸)
-- SELECT c.id, c.name, c.code, c."createdBy", c."isPublic", co.status
-- FROM "Customer" c
-- LEFT JOIN "CustomerOrganization" co ON c.id = co."customerId"
-- WHERE c."createdBy" IS NOT NULL AND c."isPublic" = false;

