INSERT INTO "User" (
  id, 
  email, 
  password, 
  name, 
  role, 
  "organizationName",
  "createdAt", 
  "updatedAt"
)
VALUES (
  'admin-' || gen_random_uuid()::text,
  'tigrofin@gmail.com',
  '$2b$10$heM/orKVUAkv8p7XZ/K2j.YyTnfTd.IkieJlxF1xR02Ylg/1LcrN2',
  '티그로시스템관리자',
  'SUPER_ADMIN',
  '티그로',
  NOW(),
  NOW()
);
