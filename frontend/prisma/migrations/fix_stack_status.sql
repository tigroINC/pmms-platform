-- 기존 굴뚝 데이터 상태 업데이트
-- 실행 전 백업 필수!

-- 1. 환경측정기업이 등록한 굴뚝 (draftCreatedBy 있음) → PENDING_REVIEW
UPDATE Stack 
SET status = 'PENDING_REVIEW'
WHERE (status IS NULL OR status = '')
  AND draftCreatedBy IS NOT NULL
  AND draftCreatedBy != '';

-- 2. 고객사 직접 등록 굴뚝 (createdBy가 고객사 사용자) → CONFIRMED
UPDATE Stack 
SET status = 'CONFIRMED',
    isVerified = 1,
    verifiedBy = createdBy,
    verifiedAt = datetime('now')
WHERE (status IS NULL OR status = '')
  AND createdBy IN (
    SELECT id FROM User WHERE role IN ('CUSTOMER_ADMIN', 'CUSTOMER_USER')
  );

-- 3. 나머지 굴뚝 (상태 없는 경우) → CONFIRMED (기본값)
UPDATE Stack 
SET status = 'CONFIRMED'
WHERE (status IS NULL OR status = '');

-- 확인 쿼리
SELECT 
  status,
  COUNT(*) as count,
  GROUP_CONCAT(DISTINCT CASE WHEN draftCreatedBy IS NOT NULL THEN 'has_draftCreatedBy' ELSE 'no_draftCreatedBy' END) as draft_info
FROM Stack
GROUP BY status;
