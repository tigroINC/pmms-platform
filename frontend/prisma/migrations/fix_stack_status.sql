-- 기존 굴뚝 ?�이???�태 ?�데?�트
-- ?�행 ??백업 ?�수!

-- 1. ?�경측정기업???�록??굴뚝 (draftCreatedBy ?�음) ??PENDING_REVIEW
UPDATE Stack 
SET status = 'PENDING_REVIEW'
WHERE (status IS NULL OR status = '')
  AND draftCreatedBy IS NOT NULL
  AND draftCreatedBy != '';

-- 2. 고객??직접 ?�록 굴뚝 (createdBy가 고객???�용?? ??CONFIRMED
UPDATE Stack 
SET status = 'CONFIRMED',
    isVerified = 1,
    verifiedBy = createdBy,
    verifiedAt = TIMESTAMP('now')
WHERE (status IS NULL OR status = '')
  AND createdBy IN (
    SELECT id FROM User WHERE role IN ('CUSTOMER_ADMIN', 'CUSTOMER_USER')
  );

-- 3. ?�머지 굴뚝 (?�태 ?�는 경우) ??CONFIRMED (기본�?
UPDATE Stack 
SET status = 'CONFIRMED'
WHERE (status IS NULL OR status = '');

-- ?�인 쿼리
SELECT 
  status,
  COUNT(*) as count,
  GROUP_CONCAT(DISTINCT CASE WHEN draftCreatedBy IS NOT NULL THEN 'has_draftCreatedBy' ELSE 'no_draftCreatedBy' END) as draft_info
FROM Stack
GROUP BY status;

