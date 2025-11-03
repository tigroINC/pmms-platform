# PDF 생성 방식 가이드

## ⚠️ CRITICAL: PDF 생성은 백엔드에서만 수행됩니다

이 문서는 인사이트 보고서 PDF 생성 방식을 설명하고, 이전 버전(HTML fallback)으로 돌아가지 않도록 하는 방법을 안내합니다.

---

## 📋 목차

1. [현재 구현 방식](#현재-구현-방식)
2. [이전 문제점](#이전-문제점)
3. [해결 방법](#해결-방법)
4. [검증 방법](#검증-방법)
5. [문제 해결](#문제-해결)

---

## 현재 구현 방식

### 백엔드 (Python FastAPI)

**파일**: `backend/main.py`

```python
# PDF 생성 (Playwright 사용) - 필수 기능
# ⚠️ CRITICAL: PDF 생성은 필수입니다. 실패 시 에러를 반환합니다.
# HTML fallback은 지원하지 않습니다.
try:
    from playwright.async_api import async_playwright
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # HTML 콘텐츠 설정
        html_with_style = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                @page {{
                    margin: 25mm 20mm;
                    size: A4;
                }}
                body {{
                    font-family: 'Malgun Gothic', 'Noto Sans KR', sans-serif;
                    margin: 0;
                    padding: 0;
                }}
            </style>
        </head>
        <body>
            {report['narrative']}
        </body>
        </html>
        """
        
        await page.set_content(html_with_style)
        
        # PDF 생성
        pdf_bytes = await page.pdf(
            format='A4',
            margin={'top': '25mm', 'right': '20mm', 'bottom': '25mm', 'left': '20mm'},
            print_background=True
        )
        
        await browser.close()
        
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        # PDF 생성 검증
        if not pdf_base64 or len(pdf_base64) < 100:
            raise ValueError("PDF generation failed: Empty or invalid PDF data")
            
except Exception as pdf_error:
    # PDF 생성 실패 시 명확한 에러 반환
    raise HTTPException(
        status_code=500,
        detail=f"PDF 생성 실패: {str(pdf_error)}. Playwright가 올바르게 설치되었는지 확인하세요."
    )
```

**핵심 포인트**:
- ✅ PDF 생성 실패 시 **HTTPException 발생** (500 에러)
- ✅ `pdf_base64` 필드가 **항상 존재**하거나 에러 발생
- ❌ HTML fallback **절대 제공하지 않음**

### 프론트엔드 (Next.js/TypeScript)

**파일**: `frontend/src/app/dashboard/page.tsx`

```typescript
const data: InsightReportResponse = await res.json();

// ⚠️ CRITICAL: PDF 생성은 백엔드에서 필수로 수행됩니다.
// HTML fallback은 지원하지 않습니다.
// 타입 가드로 응답 검증
if (!isValidPdfResponse(data)) {
  throw new Error('백엔드에서 유효하지 않은 응답을 받았습니다. PDF 데이터가 없습니다.');
}

// PDF Base64 검증
validatePdfBase64(data.pdf_base64);

// PDF 표시 (백엔드에서 생성된 PDF만 지원)
if (confirm('📊 보고서가 생성되었습니다.\n\nPDF를 새 탭에서 여시겠습니까?')) {
  try {
    // Base64를 Blob으로 변환
    const byteCharacters = atob(data.pdf_base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    // PDF를 새 탭에서 열기
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      alert('⚠️ 팝업이 차단되었습니다.');
    }
  } catch (pdfError) {
    console.error('PDF 표시 오류:', pdfError);
    alert('PDF 표시 중 오류가 발생했습니다.');
  }
}
```

**핵심 포인트**:
- ✅ TypeScript 타입으로 `pdf_base64` **필수 강제**
- ✅ 타입 가드 `isValidPdfResponse()` 검증
- ✅ `validatePdfBase64()` 함수로 Base64 검증
- ❌ HTML fallback 코드 **완전 제거**

---

## 이전 문제점

### 문제 상황

```typescript
// ❌ 잘못된 방식 (이전 버전)
if (data.pdf_base64) {
  // PDF 표시
} else if (confirm('...')) {
  // HTML 표시 (기존 방식) ← 문제!
  const reportWindow = window.open('', '_blank');
  reportWindow.document.write(`
    <!DOCTYPE html>
    <html>
      ...
    </html>
  `);
}
```

**문제점**:
1. 백엔드에서 PDF 생성에 실패해도 프론트엔드에서 HTML로 표시
2. PDF 생성 실패가 숨겨져서 문제 파악 어려움
3. 일관성 없는 보고서 형식 (PDF vs HTML)
4. 백엔드 PDF 생성 기능이 제대로 작동하는지 확인 불가

---

## 해결 방법

### 1. 백엔드 PDF 생성 필수화

**변경 사항**:
- PDF 생성 실패 시 `HTTPException` 발생
- `pdf_base64` 검증 로직 추가
- HTML fallback 제거

**코드**: `backend/main.py` 참조

### 2. 프론트엔드 HTML Fallback 제거

**변경 사항**:
- `if-else` 구조에서 HTML fallback 제거
- PDF 없으면 에러 발생
- 타입 검증 추가

**코드**: `frontend/src/app/dashboard/page.tsx` 참조

### 3. TypeScript 타입 정의

**파일**: `frontend/src/types/insight.ts`

```typescript
export interface InsightReportResponse {
  predictions: PredictionData[];
  model_info: ModelInfo;
  training_samples: number;
  accuracy_metrics?: AccuracyMetrics;
  insight_report: InsightReport;
  /** 
   * PDF Base64 인코딩 문자열 (필수)
   * 백엔드에서 Playwright를 사용하여 생성
   */
  pdf_base64: string; // ⚠️ 필수 필드 - optional(?)이 아님
}

/**
 * 타입 가드: PDF가 유효한지 검증
 */
export function isValidPdfResponse(response: any): response is InsightReportResponse {
  return (
    response &&
    typeof response === 'object' &&
    typeof response.pdf_base64 === 'string' &&
    response.pdf_base64.length > 100 && // 최소 길이 검증
    Array.isArray(response.predictions) &&
    response.model_info &&
    response.insight_report
  );
}

/**
 * PDF Base64 검증 함수
 */
export function validatePdfBase64(pdf_base64: string): void {
  if (!pdf_base64) {
    throw new Error('PDF 데이터가 없습니다.');
  }
  
  if (pdf_base64.length < 100) {
    throw new Error('PDF 데이터가 너무 짧습니다. 유효하지 않은 데이터일 수 있습니다.');
  }
  
  // Base64 형식 검증
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(pdf_base64)) {
    throw new Error('유효하지 않은 Base64 형식입니다.');
  }
}
```

### 4. 테스트 코드

**파일**: `backend/test_pdf_generation.py`

```bash
# 테스트 실행
cd backend
python test_pdf_generation.py
```

**예상 출력**:
```
✅ Playwright import 성공
✅ 브라우저 실행 성공
✅ 페이지 생성 성공
✅ HTML 콘텐츠 설정 성공
✅ PDF 생성 성공 (크기: 12345 bytes)
✅ Base64 인코딩 성공 (길이: 16460 chars)
✅ PDF 검증 성공
✅ 브라우저 종료 성공

✅ PDF 생성 기능이 정상 작동합니다!
```

---

## 검증 방법

### 1. 백엔드 검증

```bash
# 1. Playwright 설치 확인
cd backend
python -c "from playwright.async_api import async_playwright; print('✅ Playwright 설치됨')"

# 2. PDF 생성 테스트
python test_pdf_generation.py

# 3. API 서버 실행
python main.py
```

### 2. 프론트엔드 검증

```bash
# 1. TypeScript 컴파일 확인
cd frontend
npm run build

# 2. 타입 체크
npx tsc --noEmit
```

### 3. 통합 테스트

1. 백엔드 서버 실행: `http://localhost:8000`
2. 프론트엔드 실행: `http://localhost:3000`
3. 대시보드에서 "📊 인사이트 보고서" 버튼 클릭
4. PDF가 새 탭에서 열리는지 확인
5. 브라우저 개발자 도구에서 네트워크 탭 확인:
   - Response에 `pdf_base64` 필드 존재 확인
   - 길이가 100자 이상인지 확인

---

## 문제 해결

### PDF 생성 실패 시

**증상**:
```
❌ 보고서 생성 실패

PDF 생성 실패: ... Playwright가 올바르게 설치되었는지 확인하세요.
```

**해결 방법**:

1. **Playwright 재설치**:
```bash
cd backend
pip uninstall playwright
pip install playwright
playwright install chromium
```

2. **시스템 의존성 확인** (Linux):
```bash
playwright install-deps chromium
```

3. **권한 확인** (Windows):
   - 관리자 권한으로 실행
   - 바이러스 백신 예외 설정

### 타입 에러 발생 시

**증상**:
```typescript
Property 'pdf_base64' does not exist on type 'any'
```

**해결 방법**:
1. `frontend/src/types/insight.ts` 파일 확인
2. import 문 확인:
```typescript
import { InsightReportResponse, isValidPdfResponse, validatePdfBase64 } from "@/types/insight";
```

### 팝업 차단 시

**증상**:
```
⚠️ 팝업이 차단되었습니다.
```

**해결 방법**:
1. 브라우저 주소창 오른쪽의 팝업 차단 아이콘 클릭
2. 이 사이트의 팝업 허용
3. 다시 시도

---

## 체크리스트

이전 버전으로 돌아가지 않도록 다음을 확인하세요:

### 백엔드
- [ ] `backend/main.py`에서 PDF 생성 실패 시 `HTTPException` 발생
- [ ] `pdf_base64` 검증 로직 존재
- [ ] HTML fallback 코드 없음
- [ ] 주석에 "⚠️ CRITICAL" 표시

### 프론트엔드
- [ ] `frontend/src/app/dashboard/page.tsx`에서 HTML fallback 코드 제거
- [ ] `InsightReportResponse` 타입 사용
- [ ] `isValidPdfResponse()` 타입 가드 사용
- [ ] `validatePdfBase64()` 검증 함수 사용
- [ ] 주석에 "⚠️ CRITICAL" 표시

### 타입 정의
- [ ] `frontend/src/types/insight.ts` 파일 존재
- [ ] `pdf_base64: string` (optional 아님)
- [ ] 타입 가드 함수 존재
- [ ] 검증 함수 존재

### 테스트
- [ ] `backend/test_pdf_generation.py` 실행 성공
- [ ] PDF 생성 크기 > 0 bytes
- [ ] Base64 인코딩 길이 > 100 chars

---

## 참고 자료

- **Playwright 문서**: https://playwright.dev/python/
- **FastAPI 문서**: https://fastapi.tiangolo.com/
- **TypeScript 타입 가드**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html

---

## 버전 이력

### v2.0 (현재) - PDF 전용
- ✅ 백엔드 PDF 생성 필수화
- ✅ 프론트엔드 HTML fallback 제거
- ✅ TypeScript 타입 정의
- ✅ 검증 로직 추가

### v1.0 (이전) - HTML Fallback 지원
- ❌ PDF 생성 실패 시 HTML로 표시
- ❌ 일관성 없는 보고서 형식
- ❌ 문제 파악 어려움

---

## 결론

**절대 이전 버전으로 돌아가지 마세요!**

이 가이드에 따라 구현하면:
1. PDF 생성이 필수로 강제됨
2. 문제 발생 시 즉시 파악 가능
3. 일관된 보고서 형식 유지
4. TypeScript 타입 안전성 확보

문제가 발생하면 이 문서의 "문제 해결" 섹션을 참조하세요.
