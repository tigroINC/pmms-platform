# CS 커뮤니케이션 관리 기능정의서

**프로젝트명**: BOAS 환경측정 플랫폼  
**모듈명**: CS 커뮤니케이션 관리  
**작성일**: 2025-11-05  
**버전**: 1.0

---

## 📋 목차

1. [개요](#1-개요)
2. [기능 목록](#2-기능-목록)
3. [권한 매트릭스](#3-권한-매트릭스)
4. [API 명세](#4-api-명세)
5. [화면 플로우](#5-화면-플로우)
6. [알림 시나리오](#6-알림-시나리오)
7. [데이터베이스 스키마](#7-데이터베이스-스키마)
8. [에러 코드](#8-에러-코드)
9. [개발 일정](#9-개발-일정)

---

## 1. 개요

### 1.1 목적
환경측정기업과 고객사 간의 모든 커뮤니케이션을 체계적으로 기록하고 관리하여, 고객 응대 품질 향상 및 히스토리 추적을 지원합니다.

### 1.2 주요 기능
- 전화, 이메일, 방문, 카톡 등 다채널 소통 기록
- 고객사별 커뮤니케이션 타임라인 조회
- 측정 업무와 연계된 소통 이력 관리
- 답변 대기 건 추적 및 알림
- 자주 쓰는 문구 템플릿 관리

### 1.3 사용자 역할
- **SUPER_ADMIN**: 시스템 관리자 (전체 접근)
- **STAFF**: 환경측정기업 직원 (담당 고객사)
- **CUSTOMER_ADMIN**: 고객사 관리자 (자사 데이터)
- **CUSTOMER_USER**: 고객사 일반 사용자 (자사 데이터)

---

## 2. 기능 목록

### 2.1 기본 기능 (Phase 1)

| 기능 ID | 기능명 | 설명 | 우선순위 | 예상 공수 |
|---------|--------|------|----------|-----------|
| **COMM-001** | 커뮤니케이션 등록 | 고객사와의 소통 내역 신규 등록 | 높음 | 3일 |
| **COMM-002** | 커뮤니케이션 목록 조회 | 전체 커뮤니케이션 목록 조회 및 필터링 | 높음 | 2일 |
| **COMM-003** | 커뮤니케이션 상세 조회 | 특정 커뮤니케이션 상세 정보 조회 | 높음 | 1일 |
| **COMM-004** | 커뮤니케이션 수정 | 등록된 커뮤니케이션 수정 (24시간 이내) | 중간 | 2일 |
| **COMM-005** | 커뮤니케이션 삭제 | 커뮤니케이션 삭제 (Soft Delete) | 중간 | 1일 |
| **COMM-006** | 고객사별 타임라인 조회 | 특정 고객사의 모든 커뮤니케이션 시계열 조회 | 높음 | 3일 |
| **COMM-007** | 검색 기능 | 키워드, 날짜, 채널, 상태로 검색 | 높음 | 2일 |
| **COMM-008** | 상태 변경 | 답변대기/완료/참고 상태 변경 | 높음 | 1일 |

### 2.2 고급 기능 (Phase 2)

| 기능 ID | 기능명 | 설명 | 우선순위 | 예상 공수 |
|---------|--------|------|----------|-----------|
| **COMM-009** | 측정 건 연동 조회 | 특정 측정 건 관련 커뮤니케이션 조회 | 중간 | 2일 |
| **COMM-010** | 첨부파일 업로드 | 이미지, PDF 등 파일 첨부 | 중간 | 3일 |
| **COMM-011** | 후속 메모 추가 | 커뮤니케이션에 메모 추가 (@멘션 포함) | 중간 | 2일 |
| **COMM-012** | 담당자 배정 | 특정 담당자에게 커뮤니케이션 배정 | 중간 | 1일 |
| **COMM-013** | 일괄 상태 변경 | 여러 건 선택하여 상태 일괄 변경 | 낮음 | 2일 |
| **COMM-014** | 내 할일 조회 | 담당자로 배정된 답변대기 건 조회 | 높음 | 1일 |
| **COMM-015** | 고객 요청사항 조회 | 고객사가 직접 등록한 요청사항 조회 | 중간 | 1일 |

### 2.3 템플릿 관리 (Phase 2)

| 기능 ID | 기능명 | 설명 | 우선순위 | 예상 공수 |
|---------|--------|------|----------|-----------|
| **COMM-T01** | 템플릿 목록 조회 | 자주 쓰는 문구 템플릿 목록 조회 | 중간 | 1일 |
| **COMM-T02** | 템플릿 등록 | 새로운 템플릿 생성 | 중간 | 1일 |
| **COMM-T03** | 템플릿 수정/삭제 | 기존 템플릿 수정 또는 삭제 | 중간 | 1일 |
| **COMM-T04** | 템플릿 적용 | 등록 시 템플릿 선택하여 자동 입력 | 중간 | 1일 |

### 2.4 통계 및 대시보드 (Phase 3)

| 기능 ID | 기능명 | 설명 | 우선순위 | 예상 공수 |
|---------|--------|------|----------|-----------|
| **COMM-S01** | 답변대기 건수 조회 | 실시간 답변대기 건수 통계 | 낮음 | 1일 |
| **COMM-S02** | 채널별 분포 통계 | 전화/이메일/방문 등 채널별 사용 빈도 | 낮음 | 2일 |
| **COMM-S03** | 담당자별 처리량 통계 | 담당자별 처리 건수 및 평균 응답 시간 | 낮음 | 2일 |
| **COMM-S04** | 고객사별 소통 빈도 | 고객사별 월간 소통 횟수 통계 | 낮음 | 1일 |

### 2.5 모바일 특화 기능 (Phase 3)

| 기능 ID | 기능명 | 설명 | 우선순위 | 예상 공수 |
|---------|--------|------|----------|-----------|
| **COMM-M01** | 오프라인 등록 | 네트워크 없어도 임시 저장 후 동기화 | 낮음 | 3일 |
| **COMM-M02** | 음성 입력 | 음성으로 내용 입력 (Web Speech API) | 낮음 | 2일 |
| **COMM-M03** | 빠른 등록 위젯 | 홈 화면에서 원클릭 등록 | 낮음 | 2일 |

---

## 3. 권한 매트릭스

### 3.1 기능별 권한

| 기능 | SUPER_ADMIN | STAFF | CUSTOMER_ADMIN | CUSTOMER_USER |
|------|-------------|-------|----------------|---------------|
| **등록** | ✅ 모든 고객사 | ✅ 담당 고객사 | ✅ 자사만 (발신) | ✅ 자사만 (발신) |
| **조회 (목록)** | ✅ 전체 | ✅ 담당 고객사 | ✅ 자사만 | ✅ 자사만 |
| **조회 (상세)** | ✅ 전체 | ✅ 담당 고객사 | ✅ 자사만 | ✅ 자사만 |
| **수정** | ✅ 전체 | ✅ 본인 작성(24h) | ❌ | ❌ |
| **삭제** | ✅ 전체 | ✅ 본인 작성(24h) | ❌ | ❌ |
| **상태 변경** | ✅ 전체 | ✅ 본인/배정받은 건 | ❌ | ❌ |
| **담당자 배정** | ✅ 전체 | ✅ 담당 고객사 건 | ❌ | ❌ |
| **메모 추가** | ✅ 전체 | ✅ 조회 가능한 건 | ❌ | ❌ |
| **첨부파일** | ✅ | ✅ | ✅ | ✅ |
| **템플릿 관리** | ✅ 전체 | ✅ 본인 템플릿 | ❌ | ❌ |
| **통계 조회** | ✅ 전체 | ✅ 담당 고객사 | ❌ | ❌ |

### 3.2 권한 적용 규칙

#### SUPER_ADMIN
- 모든 기능에 제한 없이 접근 가능
- 모든 고객사의 커뮤니케이션 조회/수정/삭제 가능
- 시스템 전체 통계 조회 가능

#### STAFF (환경측정기업 직원)
- 자신이 담당하는 고객사의 커뮤니케이션만 조회 가능
- 본인이 작성한 커뮤니케이션은 24시간 이내 수정/삭제 가능
- 담당 고객사 관련 통계 조회 가능

#### CUSTOMER_ADMIN / CUSTOMER_USER (고객사)
- 자사 관련 커뮤니케이션만 조회 가능 (읽기 전용)
- 환경측정기업에 요청사항 등록 가능 (direction은 자동으로 OUTBOUND)
- customerId는 자동으로 본인 회사로 설정됨
- 수정/삭제 불가 (등록 후 환경측정기업에서 관리)

### 3.3 데이터 접근 제한 로직

```typescript
// STAFF의 경우
WHERE (
  customerId IN (SELECT customerId FROM customer_assignments WHERE userId = :userId)
  OR createdById = :userId
)

// CUSTOMER의 경우
WHERE customerId = :userCustomerId

// SUPER_ADMIN의 경우
WHERE 1=1 (제한 없음)
```

---

## 4. API 명세

### 4.1 커뮤니케이션 등록

**COMM-001: POST /api/communications**

#### Request
```json
{
  "customerId": "cust_123",
  "measurementId": "meas_456", // optional
  "stackId": "stack_789", // optional
  "contactAt": "2025-11-05T14:30:00Z",
  "channel": "PHONE",
  "direction": "INBOUND",
  "subject": "보고서 재발행 요청",
  "content": "10월 측정 보고서 PM10 수치 확인 부탁드립니다.",
  "status": "PENDING",
  "priority": "NORMAL",
  "assignedToId": "user_321" // optional
}
```

#### Response (201 Created)
```json
{
  "id": "comm_001",
  "customerId": "cust_123",
  "customer": {
    "id": "cust_123",
    "name": "A산업 주식회사"
  },
  "contactAt": "2025-11-05T14:30:00Z",
  "channel": "PHONE",
  "direction": "INBOUND",
  "subject": "보고서 재발행 요청",
  "content": "10월 측정 보고서 PM10 수치 확인 부탁드립니다.",
  "status": "PENDING",
  "priority": "NORMAL",
  "createdById": "user_999",
  "createdBy": {
    "id": "user_999",
    "name": "홍길동"
  },
  "assignedToId": "user_321",
  "assignedTo": {
    "id": "user_321",
    "name": "김철수"
  },
  "isDeleted": false,
  "createdAt": "2025-11-05T14:30:15Z",
  "updatedAt": "2025-11-05T14:30:15Z"
}
```

#### Error Response (403 Forbidden)
```json
{
  "error": "PERMISSION_DENIED",
  "message": "담당 고객사가 아닙니다"
}
```

---

### 4.2 커뮤니케이션 목록 조회

**COMM-002: GET /api/communications**

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `customerId` | string | ❌ | 고객사 ID 필터 | `cust_123` |
| `status` | string | ❌ | 상태 필터 (PENDING, COMPLETED, REFERENCE) | `PENDING` |
| `channel` | string | ❌ | 채널 필터 | `PHONE` |
| `priority` | string | ❌ | 우선순위 필터 | `URGENT` |
| `assignedToId` | string | ❌ | 담당자 필터 | `user_321` |
| `startDate` | string | ❌ | 시작일 (ISO 8601) | `2025-11-01T00:00:00Z` |
| `endDate` | string | ❌ | 종료일 (ISO 8601) | `2025-11-30T23:59:59Z` |
| `search` | string | ❌ | 키워드 검색 (subject, content) | `보고서` |
| `page` | number | ❌ | 페이지 번호 (기본값: 1) | `1` |
| `limit` | number | ❌ | 페이지당 개수 (기본값: 50, 최대: 100) | `50` |

#### Response (200 OK)
```json
{
  "data": [
    {
      "id": "comm_001",
      "customerId": "cust_123",
      "customer": {
        "id": "cust_123",
        "name": "A산업 주식회사"
      },
      "contactAt": "2025-11-05T14:30:00Z",
      "channel": "PHONE",
      "direction": "INBOUND",
      "subject": "보고서 재발행 요청",
      "content": "10월 측정 보고서...",
      "status": "PENDING",
      "priority": "NORMAL",
      "createdBy": {
        "id": "user_999",
        "name": "홍길동"
      },
      "assignedTo": {
        "id": "user_321",
        "name": "김철수"
      },
      "_count": {
        "notes": 2,
        "attachments": 1
      },
      "createdAt": "2025-11-05T14:30:15Z",
      "updatedAt": "2025-11-05T15:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 127,
    "totalPages": 3
  }
}
```

---

### 4.3 고객사별 타임라인 조회

**COMM-006: GET /api/customers/:customerId/communications**

#### Path Parameters
- `customerId`: 고객사 ID

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `startDate` | string | ❌ | 시작일 |
| `endDate` | string | ❌ | 종료일 |
| `channel` | string | ❌ | 채널 필터 |

#### Response (200 OK)
```json
{
  "customer": {
    "id": "cust_123",
    "name": "A산업 주식회사"
  },
  "communications": [
    {
      "id": "comm_003",
      "contactAt": "2025-11-05T14:30:00Z",
      "channel": "PHONE",
      "direction": "INBOUND",
      "subject": "보고서 재발행 요청",
      "content": "10월 측정 보고서...",
      "status": "PENDING",
      "priority": "URGENT",
      "createdBy": {
        "name": "홍길동"
      },
      "notes": [
        {
          "note": "데이터 재확인 중",
          "createdBy": {
            "name": "김철수"
          },
          "createdAt": "2025-11-05T16:00:00Z"
        }
      ],
      "attachments": []
    },
    {
      "id": "comm_002",
      "contactAt": "2025-11-04T09:15:00Z",
      "channel": "EMAIL",
      "direction": "OUTBOUND",
      "subject": "다음주 측정 일정 안내",
      "content": "11월 12일 화요일...",
      "status": "COMPLETED",
      "priority": "NORMAL",
      "measurementId": "meas_456",
      "measurement": {
        "scheduledDate": "2025-11-12",
        "stackName": "굴뚝#3"
      }
    }
  ]
}
```

---

### 4.4 커뮤니케이션 상태 변경

**COMM-008: PATCH /api/communications/:id/status**

#### Request
```json
{
  "status": "COMPLETED"
}
```

#### Response (200 OK)
```json
{
  "id": "comm_001",
  "status": "COMPLETED",
  "updatedAt": "2025-11-05T17:00:00Z"
}
```

---

### 4.5 후속 메모 추가

**COMM-011: POST /api/communications/:id/notes**

#### Request
```json
{
  "note": "데이터 재확인 완료. 11/6 재발행 예정",
  "mentionedUserId": "user_999" // optional, @멘션
}
```

#### Response (201 Created)
```json
{
  "id": "note_001",
  "communicationId": "comm_001",
  "note": "데이터 재확인 완료. 11/6 재발행 예정",
  "mentionedUserId": "user_999",
  "mentionedUser": {
    "id": "user_999",
    "name": "홍길동"
  },
  "createdBy": {
    "id": "user_321",
    "name": "김철수"
  },
  "createdAt": "2025-11-05T17:30:00Z"
}
```

---

### 4.6 내 할일 조회

**COMM-014: GET /api/communications/my-tasks**

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `status` | string | ❌ | 기본값: PENDING |

#### Response (200 OK)
```json
{
  "tasks": [
    {
      "id": "comm_005",
      "customer": {
        "name": "A산업 주식회사"
      },
      "contactAt": "2025-11-05T14:30:00Z",
      "channel": "PHONE",
      "subject": "긴급 문의",
      "priority": "URGENT",
      "status": "PENDING",
      "createdBy": {
        "name": "홍길동"
      }
    }
  ],
  "summary": {
    "total": 3,
    "urgent": 1,
    "high": 0,
    "normal": 2
  }
}
```

---

### 4.7 일괄 상태 변경

**COMM-013: PATCH /api/communications/bulk-status**

#### Request
```json
{
  "ids": ["comm_001", "comm_002", "comm_003"],
  "status": "COMPLETED"
}
```

#### Response (200 OK)
```json
{
  "updated": 3,
  "failed": 0
}
```

---

### 4.8 첨부파일 업로드

**COMM-010: POST /api/communications/:id/attachments**

#### Request (multipart/form-data)
```
file: [File]
```

#### Response (201 Created)
```json
{
  "id": "attach_001",
  "communicationId": "comm_001",
  "filename": "20251105_143015_abc123.jpg",
  "originalFilename": "현장사진.jpg",
  "fileUrl": "https://cdn.boas.com/communications/comm_001/20251105_143015_abc123.jpg",
  "fileSize": 2457600,
  "mimeType": "image/jpeg",
  "uploadedBy": {
    "name": "홍길동"
  },
  "uploadedAt": "2025-11-05T14:30:15Z"
}
```

---

### 4.9 템플릿 목록 조회

**COMM-T01: GET /api/communication-templates**

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `category` | string | ❌ | 카테고리 필터 |
| `channel` | string | ❌ | 채널 필터 |

#### Response (200 OK)
```json
{
  "templates": [
    {
      "id": "tmpl_001",
      "title": "측정 일정 확인",
      "content": "안녕하세요. 다음주 측정 일정 확인차 연락드립니다.",
      "category": "일정",
      "channel": "PHONE",
      "isShared": true,
      "usageCount": 45
    },
    {
      "id": "tmpl_002",
      "title": "보고서 발송 안내",
      "content": "측정 보고서 발송 완료되었습니다. 확인 부탁드립니다.",
      "category": "보고서",
      "channel": "EMAIL",
      "isShared": true,
      "usageCount": 32
    }
  ]
}
```

---

### 4.10 템플릿 등록

**COMM-T02: POST /api/communication-templates**

#### Request
```json
{
  "title": "측정 일정 변경 안내",
  "content": "측정 일정이 변경되었습니다. 새로운 일정은 다음과 같습니다.",
  "category": "일정",
  "channel": "PHONE",
  "isShared": false
}
```

#### Response (201 Created)
```json
{
  "id": "tmpl_003",
  "title": "측정 일정 변경 안내",
  "content": "측정 일정이 변경되었습니다...",
  "category": "일정",
  "channel": "PHONE",
  "isShared": false,
  "usageCount": 0,
  "createdBy": {
    "id": "user_999",
    "name": "홍길동"
  },
  "createdAt": "2025-11-05T18:00:00Z"
}
```

---

### 4.11 통계 조회

**COMM-S01: GET /api/communications/stats**

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `startDate` | string | ❌ | 통계 시작일 |
| `endDate` | string | ❌ | 통계 종료일 |

#### Response (200 OK)
```json
{
  "period": {
    "start": "2025-11-01T00:00:00Z",
    "end": "2025-11-30T23:59:59Z"
  },
  "summary": {
    "total": 127,
    "pending": 8,
    "completed": 115,
    "reference": 4
  },
  "byChannel": {
    "PHONE": 65,
    "EMAIL": 42,
    "VISIT": 15,
    "KAKAO": 5
  },
  "byPriority": {
    "URGENT": 3,
    "HIGH": 12,
    "NORMAL": 105,
    "LOW": 7
  },
  "byStaff": [
    {
      "userId": "user_999",
      "name": "홍길동",
      "count": 45,
      "avgResponseHours": 2.5
    },
    {
      "userId": "user_321",
      "name": "김철수",
      "count": 38,
      "avgResponseHours": 3.2
    }
  ],
  "topCustomers": [
    {
      "customerId": "cust_123",
      "name": "A산업 주식회사",
      "count": 18
    },
    {
      "customerId": "cust_456",
      "name": "B건설",
      "count": 12
    }
  ]
}
```

---

## 5. 화면 플로우

### 5.1 커뮤니케이션 등록 플로우 (모바일 우선)

```
[홈 화면]
    ↓
[+ 등록 버튼 탭]
    ↓
┌─────────────────────────────────┐
│ 커뮤니케이션 등록               │
├─────────────────────────────────┤
│ 1. 고객사 선택 *                │
│    - 자동완성 검색              │
│    - 최근 소통한 고객사 상단 표시│
│                                 │
│ 2. 언제 소통했나요? *           │
│    - 기본값: 현재 시각          │
│    - Date/Time Picker           │
│                                 │
│ 3. 채널 선택 *                  │
│    - 📞 전화                    │
│    - 📧 이메일                  │
│    - 👤 방문                    │
│    - 💬 카톡                    │
│                                 │
│ 4. 방향                         │
│    - ◉ 받음(수신)               │
│    - ○ 보냄(발신)               │
│                                 │
│ 5. 내용 입력 *                  │
│    - 텍스트 입력                │
│    - [템플릿 선택 ▼]            │
│    - [🎤 음성입력] (Phase 3)    │
│                                 │
│ 6. 측정 건 연결 (선택)          │
│    - 고객사 선택 시             │
│      최근 측정 자동 제시        │
│                                 │
│ 7. 우선순위                     │
│    - ○ 긴급 ○ 높음             │
│    - ◉ 보통 ○ 낮음             │
│                                 │
│ 8. 담당자 지정 (선택)           │
│    - @ 입력 시 자동완성         │
│                                 │
│ 9. 첨부파일 (선택)              │
│    - 최대 5개, 10MB             │
│                                 │
│ [저장]  [취소]                  │
└─────────────────────────────────┘
    ↓
[저장 성공]
    ↓
[목록 화면으로 이동]
    ↓
[Toast: "등록되었습니다"]
```

### 5.2 목록 조회 플로우

```
[커뮤니케이션 메뉴 선택]
    ↓
┌─────────────────────────────────┐
│ 커뮤니케이션                    │
├─────────────────────────────────┤
│ [🔍 검색] [필터 ▼] [+ 등록]    │
├─────────────────────────────────┤
│ ⚠️ 답변대기 3건                 │
│ ✅ 오늘 처리 5건                │
├─────────────────────────────────┤
│ 📌 11/05 14:30  🔴긴급          │
│ A산업 📞전화(받음)              │
│ 보고서 재발행 요청              │
│ 👤 홍길동 → @김철수             │
│ [답변하기]                      │
├─────────────────────────────────┤
│ 11/04 09:15  ✅완료             │
│ B건설 📧이메일(보냄)            │
│ 다음주 측정 일정 안내           │
│ 👤 홍길동                       │
│ 🔗 2025-11-12 굴뚝#3            │
├─────────────────────────────────┤
│ 11/03 16:20  ✅완료             │
│ C제조 👤방문                    │
│ 신규 배출구 추가 상담           │
│ 👤 김철수                       │
│ 📎 현장사진.jpg                 │
└─────────────────────────────────┘
    ↓
[항목 탭]
    ↓
[상세 화면]
```

### 5.3 타임라인 조회 플로우

```
[고객사 상세 화면]
    ↓
[커뮤니케이션 탭 선택]
    ↓
┌─────────────────────────────────┐
│ ← A산업 주식회사                │
├─────────────────────────────────┤
│ [전체 ▼] [3개월 ▼] [🔍]        │
├─────────────────────────────────┤
│ ━━━ 2025-11-05 ━━━             │
│                                 │
│ 14:30 📞 받음 🔴긴급            │
│ "보고서 PM10 수치 확인..."      │
│ 👤 홍길동  ⏳답변대기           │
│ [답변] [메모] [공유]            │
│   💬 김철수: 데이터 재확인 중   │
│   (2시간 전)                    │
│                                 │
│ ━━━ 2025-11-04 ━━━             │
│                                 │
│ 09:15 📧 보냄  ✅완료           │
│ "다음주 측정 일정 안내"         │
│ 🔗 2025-11-12 굴뚝#3            │
│    [측정 상세 보기]             │
│ 👤 홍길동                       │
│                                 │
│ ━━━ 2025-10-28 ━━━             │
│                                 │
│ 16:45 👤 방문  ✅완료           │
│ "신규 배출구 추가 상담"         │
│ 📎 현장사진.jpg                 │
│    [이미지 확대]                │
│ 👤 김철수                       │
└─────────────────────────────────┘
```

### 5.4 내 할일 플로우

```
[대시보드] or [커뮤니케이션 메뉴]
    ↓
[내 할일 탭/버튼]
    ↓
┌─────────────────────────────────┐
│ 내 할일                         │
├─────────────────────────────────┤
│ 📌 긴급 1건  ⚠️ 높음 0건       │
│ 📋 보통 2건                     │
├─────────────────────────────────┤
│ 🔴 긴급                         │
│ 11/05 14:30  A산업 📞전화       │
│ "보고서 재발행 요청"            │
│ 작성: 홍길동                    │
│ [처리하기]                      │
├─────────────────────────────────┤
│ 11/04 16:00  D전자 📧이메일     │
│ "측정 일정 조율 요청"           │
│ 작성: 이영희                    │
│ [처리하기]                      │
├─────────────────────────────────┤
│ 11/03 10:30  E화학 👤방문       │
│ "신규 계약 상담"                │
│ 작성: 박민수                    │
│ [처리하기]                      │
└─────────────────────────────────┘
    ↓
[처리하기 버튼]
    ↓
┌─────────────────────────────────┐
│ 처리 완료 처리                  │
├─────────────────────────────────┤
│ [메모 추가]                     │
│ "처리 완료했습니다. 보고서..."  │
│                                 │
│ 상태 변경:                      │
│ ○ 완료  ○ 참고                 │
│                                 │
│ [저장]  [취소]                  │
└─────────────────────────────────┘
```

### 5.5 PC 버전 차이점

#### 레이아웃
```
┌────────────────────────────────────────────────┐
│ [좌측 사이드바]  │  [메인 콘텐츠]            │
│                  │                            │
│ • 전체 목록      │  ┌────────────────────┐  │
│ • 답변대기 (3)   │  │ 필터 & 검색        │  │
│ • 내 할일 (5)    │  └────────────────────┘  │
│ • 고객 요청      │                            │
│ • 템플릿 관리    │  [커뮤니케이션 목록]      │
│                  │  - 테이블 뷰              │
│                  │  - 행 클릭 → 우측 상세    │
│                  │                            │
└────────────────────────────────────────────────┘
```

#### 등록 모달
- 모바일: 전체 화면
- PC: 중앙 모달 (600px 폭)

#### 목록 표시
- 모바일: 카드형 리스트 (무한 스크롤)
- PC: 테이블 뷰 (페이지네이션)

---

## 6. 알림 시나리오

### 6.1 알림 트리거 조건

| 시나리오 ID | 트리거 조건 | 수신자 | 알림 타입 | 우선순위 |
|-------------|-------------|--------|-----------|----------|
| **NOTI-C01** | 커뮤니케이션 등록 + 담당자 배정됨 | 배정된 담당자 | COMMUNICATION_ASSIGNED | 보통 |
| **NOTI-C02** | 커뮤니케이션 등록 + 우선순위 긴급 + 답변대기 | 배정 담당자 or 고객사 담당 매니저 | COMMUNICATION_URGENT | 높음 |
| **NOTI-C03** | 고객사가 직접 등록 (CUSTOMER 역할) | 해당 고객사 담당 환경측정기업 직원 | COMMUNICATION_CLIENT_REQUEST | 높음 |
| **NOTI-C04** | 메모에 @멘션 추가 | 멘션된 사용자 | COMMUNICATION_MENTION | 보통 |
| **NOTI-C05** | 상태 변경: 답변대기 → 완료 | 커뮤니케이션 작성자 (고객사인 경우) | COMMUNICATION_STATUS_CHANGED | 보통 |
| **NOTI-C06** | 답변대기 48시간 경과 | 배정 담당자 + 팀 리더 | COMMUNICATION_OVERDUE | 높음 |

### 6.2 상세 알림 시나리오

#### NOTI-C01: 담당자 배정
**트리거**: 커뮤니케이션 생성 또는 수정 시 `assignedToId` 설정

**조건**:
```typescript
if (assignedToId && assignedToId !== createdById) {
  // 알림 생성
}
```

**알림 내용**:
- **제목**: "새로운 커뮤니케이션이 배정되었습니다"
- **메시지**: `{customer.name}의 커뮤니케이션이 배정되었습니다`
- **링크**: `/communications/{communicationId}`
- **우선순위**: NORMAL

**수신자**: `assignedToId` 사용자

**알림 방식**:
- 인앱 알림 (Notification 테이블)
- 이메일 (선택사항)

---

#### NOTI-C02: 긴급 답변 필요
**트리거**: 커뮤니케이션 생성 시 `priority: URGENT` + `status: PENDING`

**조건**:
```typescript
if (priority === 'URGENT' && status === 'PENDING') {
  const targetUser = assignedToId 
    ? getUser(assignedToId)
    : getCustomerManager(customerId);
  // 알림 생성
}
```

**알림 내용**:
- **제목**: "긴급 답변이 필요합니다 🚨"
- **메시지**: `{customer.name}에서 긴급 답변을 요청했습니다`
- **링크**: `/communications/{communicationId}`
- **우선순위**: HIGH

**수신자**:
1. 배정된 담당자 (`assignedToId`)
2. 없으면 고객사 담당 매니저

**알림 방식**:
- 인앱 알림 (팝업)
- 이메일 즉시 발송
- SMS (선택사항 - 설정에 따라)

---

#### NOTI-C03: 고객사 요청사항 등록
**트리거**: 고객사 사용자가 커뮤니케이션 등록

**조건**:
```typescript
if (createdBy.role === 'CUSTOMER_ADMIN' || 
    createdBy.role === 'CUSTOMER_USER') {
  const managers = getCustomerManagers(customerId);
  // 담당 직원들에게 알림
}
```

**알림 내용**:
- **제목**: "고객사에서 요청사항을 등록했습니다"
- **메시지**: `{customer.name} - {subject || content.substring(0, 50)}`
- **링크**: `/communications/{communicationId}`
- **우선순위**: HIGH

**수신자**: 해당 고객사를 담당하는 환경측정기업 직원 전체

**알림 방식**:
- 인앱 알림
- 이메일

---

#### NOTI-C04: @멘션
**트리거**: 메모 추가 시 `mentionedUserId` 설정

**조건**:
```typescript
if (note.mentionedUserId) {
  // 알림 생성
}
```

**알림 내용**:
- **제목**: "커뮤니케이션에서 회원님을 언급했습니다"
- **메시지**: `{createdBy.name}님이 @{mentionedUser.name}님을 언급했습니다`
- **링크**: `/communications/{communicationId}#note-{noteId}`
- **우선순위**: NORMAL

**수신자**: `mentionedUserId` 사용자

**알림 방식**:
- 인앱 알림

---

#### NOTI-C05: 상태 변경 (고객사 알림)
**트리거**: 고객사가 등록한 커뮤니케이션의 상태가 변경됨

**조건**:
```typescript
if (createdBy.role.startsWith('CUSTOMER_') && 
    status === 'COMPLETED') {
  // 작성자에게 알림
}
```

**알림 내용**:
- **제목**: "요청하신 사항이 처리되었습니다"
- **메시지**: `{subject}에 대한 답변이 완료되었습니다`
- **링크**: `/communications/{communicationId}`
- **우선순위**: NORMAL

**수신자**: 커뮤니케이션 작성자 (고객사)

**알림 방식**:
- 인앱 알림
- 이메일

---

#### NOTI-C06: 답변 지연 경고
**트리거**: 답변대기 상태 48시간 경과 (배치 작업)

**조건**:
```typescript
// 매일 09:00 실행되는 배치 작업
SELECT * FROM communications
WHERE status = 'PENDING'
  AND createdAt < NOW() - INTERVAL 48 HOUR
  AND isDeleted = false
```

**알림 내용**:
- **제목**: "답변 대기 중인 커뮤니케이션이 있습니다 ⏰"
- **메시지**: `{customer.name}의 요청이 48시간째 미처리 상태입니다`
- **링크**: `/communications/{communicationId}`
- **우선순위**: HIGH

**수신자**:
1. 배정 담당자
2. 팀 리더 (에스컬레이션)

**알림 방식**:
- 인앱 알림
- 이메일
- 관리자 대시보드에 표시

---

### 6.3 알림 빈도 제어

#### 알림 그룹핑
- 같은 커뮤니케이션에 대한 알림은 1시간 내 1회로 제한
- 예: 메모가 5개 추가되어도 1시간에 1번만 알림

#### 알림 설정
사용자별 알림 수신 설정 (User Settings)
```json
{
  "notifications": {
    "COMMUNICATION_ASSIGNED": {
      "inApp": true,
      "email": true,
      "sms": false
    },
    "COMMUNICATION_URGENT": {
      "inApp": true,
      "email": true,
      "sms": true
    },
    "COMMUNICATION_MENTION": {
      "inApp": true,
      "email": false,
      "sms": false
    }
  }
}
```

---

## 7. 데이터베이스 스키마

### 7.1 Communication 테이블

| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| id | VARCHAR(36) | NO | cuid() | PK |
| customerId | VARCHAR(36) | NO | - | 고객사 ID (FK) |
| measurementId | VARCHAR(36) | YES | NULL | 측정 ID (FK, optional) |
| stackId | VARCHAR(36) | YES | NULL | 굴뚝 ID (FK, optional) |
| contactAt | DATETIME | NO | - | 소통 일시 |
| channel | ENUM | NO | - | 채널 (PHONE, EMAIL, VISIT, KAKAO, SMS, FAX, OTHER) |
| direction | ENUM | NO | - | 방향 (INBOUND, OUTBOUND) |
| subject | VARCHAR(255) | YES | NULL | 제목 |
| content | TEXT | NO | - | 내용 |
| status | ENUM | NO | PENDING | 상태 (PENDING, COMPLETED, REFERENCE) |
| priority | ENUM | NO | NORMAL | 우선순위 (URGENT, HIGH, NORMAL, LOW) |
| createdById | VARCHAR(36) | NO | - | 작성자 ID (FK) |
| assignedToId | VARCHAR(36) | YES | NULL | 담당자 ID (FK) |
| isDeleted | BOOLEAN | NO | false | Soft Delete 여부 |
| deletedAt | DATETIME | YES | NULL | 삭제 일시 |
| deletedById | VARCHAR(36) | YES | NULL | 삭제자 ID |
| createdAt | DATETIME | NO | now() | 생성 일시 |
| updatedAt | DATETIME | NO | now() | 수정 일시 |

**인덱스**:
- `idx_customer_status_contact` (customerId, status, contactAt DESC)
- `idx_assigned_status` (assignedToId, status, isDeleted)
- `idx_created_deleted` (createdById, isDeleted)
- `idx_deleted_contact` (isDeleted, contactAt DESC)
- `fulltext_search` (subject, content) - MySQL 8.0+

### 7.2 CommunicationAttachment 테이블

| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| id | VARCHAR(36) | NO | cuid() | PK |
| communicationId | VARCHAR(36) | NO | - | FK |
| filename | VARCHAR(255) | NO | - | 저장된 파일명 |
| originalFilename | VARCHAR(255) | NO | - | 원본 파일명 |
| fileUrl | VARCHAR(500) | NO | - | 파일 URL |
| fileSize | INT | NO | - | 파일 크기 (bytes) |
| mimeType | VARCHAR(100) | NO | - | MIME Type |
| uploadedById | VARCHAR(36) | NO | - | FK |
| uploadedAt | DATETIME | NO | now() | 업로드 일시 |

**인덱스**:
- `idx_communication` (communicationId)

### 7.3 CommunicationNote 테이블

| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| id | VARCHAR(36) | NO | cuid() | PK |
| communicationId | VARCHAR(36) | NO | - | FK |
| note | TEXT | NO | - | 메모 내용 |
| mentionedUserId | VARCHAR(36) | YES | NULL | 멘션된 사용자 ID (FK) |
| createdById | VARCHAR(36) | NO | - | FK |
| createdAt | DATETIME | NO | now() | 생성 일시 |

**인덱스**:
- `idx_communication` (communicationId)
- `idx_mentioned` (mentionedUserId)

### 7.4 CommunicationTemplate 테이블

| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| id | VARCHAR(36) | NO | cuid() | PK |
| title | VARCHAR(100) | NO | - | 템플릿 제목 |
| content | TEXT | NO | - | 템플릿 내용 |
| channel | ENUM | YES | NULL | 채널 (optional) |
| category | VARCHAR(50) | YES | NULL | 카테고리 |
| organizationId | VARCHAR(36) | YES | NULL | 조직 ID (FK) |
| isShared | BOOLEAN | NO | false | 전사 공유 여부 |
| sortOrder | INT | NO | 0 | 정렬 순서 |
| createdById | VARCHAR(36) | NO | - | FK |
| usageCount | INT | NO | 0 | 사용 횟수 |
| createdAt | DATETIME | NO | now() | 생성 일시 |
| updatedAt | DATETIME | NO | now() | 수정 일시 |

**인덱스**:
- `idx_org_shared_category` (organizationId, isShared, category)
- `idx_usage` (usageCount DESC)

### 7.5 SystemConfig 테이블

| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| id | VARCHAR(36) | NO | cuid() | PK |
| key | VARCHAR(100) | NO | - | 설정 키 (UNIQUE) |
| value | TEXT | NO | - | 설정 값 |
| category | VARCHAR(50) | YES | NULL | 카테고리 |
| createdAt | DATETIME | NO | now() | 생성 일시 |
| updatedAt | DATETIME | NO | now() | 수정 일시 |

**인덱스**:
- `unique_key` (key)
- `idx_category` (category)

**초기 데이터**:
```sql
INSERT INTO system_configs (key, value, category) VALUES
('STORAGE_PROVIDER', 'S3', 'storage'),
('STORAGE_BUCKET', 'boas-communications', 'storage'),
('STORAGE_REGION', 'ap-northeast-2', 'storage'),
('CDN_URL', 'https://cdn.boas.com', 'storage'),
('MAX_FILE_SIZE', '10485760', 'upload'), -- 10MB
('MAX_FILES_PER_COMMUNICATION', '5', 'upload');
```

---

## 8. 에러 코드

### 8.1 일반 에러

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| **INVALID_INPUT** | 400 | 입력 데이터 검증 실패 |
| **UNAUTHORIZED** | 401 | 인증 필요 |
| **PERMISSION_DENIED** | 403 | 권한 없음 |
| **NOT_FOUND** | 404 | 리소스를 찾을 수 없음 |
| **CONFLICT** | 409 | 데이터 충돌 |
| **INTERNAL_ERROR** | 500 | 서버 내부 오류 |

### 8.2 커뮤니케이션 특화 에러

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| **COMM_NOT_AUTHORIZED_CUSTOMER** | 403 | 담당 고객사가 아님 |
| **COMM_CANNOT_EDIT_AFTER_24H** | 403 | 24시간 경과하여 수정 불가 |
| **COMM_ALREADY_DELETED** | 410 | 이미 삭제된 커뮤니케이션 |
| **COMM_INVALID_STATUS_TRANSITION** | 400 | 유효하지 않은 상태 변경 |
| **COMM_FILE_TOO_LARGE** | 413 | 파일 크기 초과 (10MB) |
| **COMM_TOO_MANY_FILES** | 400 | 첨부파일 개수 초과 (5개) |
| **COMM_INVALID_FILE_TYPE** | 400 | 허용되지 않는 파일 형식 |
| **COMM_TEMPLATE_NOT_FOUND** | 404 | 템플릿을 찾을 수 없음 |
| **COMM_CUSTOMER_AUTO_OUTBOUND** | 400 | 고객사는 발신만 가능 |

### 8.3 에러 응답 형식

```json
{
  "error": "COMM_NOT_AUTHORIZED_CUSTOMER",
  "message": "담당 고객사가 아닙니다",
  "details": {
    "customerId": "cust_123",
    "userId": "user_999"
  },
  "timestamp": "2025-11-05T14:30:00Z"
}
```

---

## 9. 개발 일정

### 9.1 Phase 1: 기본 기능 (2주)

#### Week 1: 기반 구축
**Day 1-2**: DB 스키마 & Migration
- Prisma 스키마 완성 (모든 relation 포함)
- Migration 실행 및 테스트
- SystemConfig 초기 데이터 입력

**Day 3-4**: 권한 & 기본 API
- 권한 체크 함수 구현 (`canCreate`, `canUpdate`, `canDelete`)
- CRUD API 구현 (POST, GET, PATCH, DELETE)
- Unit 테스트 작성

**Day 5**: 테스트 & 리뷰
- API 통합 테스트
- 권한별 시나리오 테스트
- 코드 리뷰

#### Week 2: 화면 개발 (모바일 우선)
**Day 1-2**: 등록 화면
- 빠른 등록 폼 (모바일)
- 고객사 자동완성
- 템플릿 선택 기능

**Day 3-4**: 목록 & 검색
- 커뮤니케이션 목록 화면
- 필터링 (상태, 채널, 날짜)
- 검색 기능

**Day 5**: 반응형 레이아웃
- PC 버전 레이아웃 조정
- 테이블 뷰 구현
- 통합 테스트

### 9.2 Phase 2: 고급 기능 (2주)

#### Week 3: 연동 & 메모
**Day 1-2**: 타임라인 & 측정 연동
- 고객사별 타임라인 뷰
- 측정 관리 화면 연동
- 측정 상세 → 커뮤니케이션 탭

**Day 3-4**: 메모 & 할일
- 후속 메모 기능 (@멘션)
- 내 할일 대시보드
- 고객 요청사항 조회

**Day 5**: 상태 관리
- 상태 변경 기능
- 일괄 상태 변경
- 담당자 배정

#### Week 4: 템플릿 & 파일
**Day 1-2**: 템플릿 관리
- 템플릿 CRUD
- 템플릿 적용
- 사용 통계

**Day 3-4**: 파일 업로드
- S3 연동
- 파일 업로드/다운로드
- 이미지 미리보기

**Day 5**: 알림 연동
- 알림 시나리오 구현
- 이메일 발송 (선택)
- 통합 테스트

### 9.3 Phase 3: 최적화 & 고도화 (1주)

#### Week 5: 모바일 & 통계
**Day 1-2**: 오프라인 & 음성
- IndexedDB 동기화
- 음성 입력 (Web Speech API)
- PWA 설정

**Day 3-4**: 통계 대시보드
- 답변대기/처리 통계
- 채널별 분포
- 담당자별 처리량

**Day 5**: 최종 테스트 & 배포
- E2E 테스트
- 성능 테스트
- 배포 준비

### 9.4 총 공수 산정

| Phase | 기간 | 개발자 | 총 공수 |
|-------|------|--------|---------|
| Phase 1 | 2주 | 2명 | 20일 |
| Phase 2 | 2주 | 2명 | 20일 |
| Phase 3 | 1주 | 2명 | 10일 |
| **합계** | **5주** | **2명** | **50일** |

### 9.5 마일스톤

| 마일스톤 | 날짜 | 주요 산출물 |
|----------|------|-------------|
| **M1: 기본 기능 완료** | Week 2 종료 | 등록/조회/수정/삭제 기능 |
| **M2: 고급 기능 완료** | Week 4 종료 | 타임라인/메모/템플릿/파일 |
| **M3: 배포 준비 완료** | Week 5 종료 | 통계/모바일/테스트 |
| **M4: 프로덕션 배포** | Week 6 | 실서비스 오픈 |

---

## 부록

### A. 용어 정리

- **커뮤니케이션**: 환경측정기업과 고객사 간의 모든 형태의 소통 (전화, 이메일, 방문 등)
- **채널**: 소통 수단 (PHONE, EMAIL, VISIT, KAKAO 등)
- **방향**: 수신(INBOUND) 또는 발신(OUTBOUND)
- **상태**: 답변대기(PENDING), 완료(COMPLETED), 참고(REFERENCE)
- **우선순위**: 긴급(URGENT), 높음(HIGH), 보통(NORMAL), 낮음(LOW)
- **타임라인**: 특정 고객사와의 모든 커뮤니케이션을 시간순으로 나열한 뷰
- **내 할일**: 자신에게 배정된 답변대기 상태의 커뮤니케이션 목록

### B. 참고 링크

- Prisma 공식 문서: https://www.prisma.io/docs
- Next.js API Routes: https://nextjs.org/docs/api-routes/introduction
- AWS S3 SDK: https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

### C. 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 1.0 | 2025-11-05 | 초안 작성 | Steve |

---

**문서 끝**
