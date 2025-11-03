# 📧 이메일 발송 설정 가이드

직원 초대 메일 발송을 위한 이메일 설정 방법입니다.

## 🔧 Gmail 사용 (권장)

### 1. Gmail 앱 비밀번호 생성

1. Google 계정 설정 → 보안
2. **2단계 인증** 활성화 (필수)
3. **앱 비밀번호** 생성
   - 앱 선택: 메일
   - 기기 선택: 기타 (사용자 지정 이름)
   - 이름: "Boaz 시스템"
4. 생성된 16자리 비밀번호 복사

### 2. 환경 변수 설정

`.env.local` 파일에 추가:

```env
# 이메일 설정
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="xxxx xxxx xxxx xxxx"  # 앱 비밀번호 (공백 포함)
EMAIL_NOREPLY="noreply@yourdomain.com"  # 선택사항

# 앱 URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # 개발 환경
# NEXT_PUBLIC_APP_URL="https://yourdomain.com"  # 프로덕션
```

### 3. 테스트

```bash
# 개발 서버 재시작
npm run dev

# 직원 초대 기능 테스트
# /org/staff 페이지에서 "직원 초대" 버튼 클릭
```

---

## 🏢 회사 SMTP 서버 사용

회사 메일 서버를 사용하는 경우:

### 1. SMTP 정보 확인

IT 부서에 다음 정보 요청:
- SMTP 서버 주소
- 포트 번호
- 인증 방식
- 계정 정보

### 2. `lib/email.ts` 수정

```typescript
const transporter = nodemailer.createTransport({
  host: 'smtp.yourcompany.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

---

## 🎨 이메일 템플릿 커스터마이징

`lib/email.ts` 파일에서 HTML 템플릿 수정 가능:

```typescript
const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <!-- 회사 로고, 색상 등 커스터마이징 -->
  </head>
  <body>
    <!-- 이메일 내용 -->
  </body>
  </html>
`;
```

---

## ⚠️ 주의사항

### 보안
- `.env.local` 파일은 절대 Git에 커밋하지 마세요
- 앱 비밀번호는 안전하게 보관하세요
- 프로덕션에서는 환경 변수를 서버에 안전하게 설정하세요

### Gmail 발송 제한
- 일일 발송 제한: 약 500통
- 대량 발송이 필요한 경우 SendGrid, AWS SES 등 전문 서비스 사용 권장

### 테스트
- 개발 환경에서 충분히 테스트 후 프로덕션 배포
- 스팸 폴더 확인
- 다양한 이메일 클라이언트에서 테스트 (Gmail, Outlook, 네이버 등)

---

## 🔍 문제 해결

### "Invalid login" 오류
- 2단계 인증이 활성화되어 있는지 확인
- 앱 비밀번호를 올바르게 입력했는지 확인
- 일반 비밀번호가 아닌 앱 비밀번호를 사용해야 함

### 메일이 발송되지 않음
- 환경 변수가 올바르게 설정되었는지 확인
- 서버 재시작
- 방화벽 설정 확인 (포트 587, 465)

### 메일이 스팸으로 분류됨
- SPF, DKIM, DMARC 레코드 설정 (도메인 소유 시)
- 발신자 이름 및 주소 확인
- 이메일 내용 개선 (스팸 키워드 제거)

---

## 📚 참고 자료

- [Nodemailer 공식 문서](https://nodemailer.com/)
- [Gmail 앱 비밀번호 생성](https://support.google.com/accounts/answer/185833)
- [SendGrid 가이드](https://sendgrid.com/docs/)
- [AWS SES 가이드](https://aws.amazon.com/ses/)
