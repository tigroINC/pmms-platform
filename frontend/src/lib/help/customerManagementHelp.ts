export interface HelpSection {
  id: string;
  title: string;
  content: string;
}

export function getCustomerManagementHelpSections(): HelpSection[] {
  return [
    {
      id: "create",
      title: "신규 생성",
      content: `
<h3 style="margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600;">개별 생성</h3>
<ol style="margin: 0 0 24px 0; padding-left: 24px; line-height: 1.8;">
  <li><strong>신규 등록</strong> 버튼 클릭</li>
  <li>필수 정보 입력:
    <ul style="margin: 8px 0; padding-left: 24px;">
      <li>고객사명</li>
      <li>사업자등록번호</li>
      <li>사업장 구분 (1사업장, 2사업장 등)</li>
    </ul>
  </li>
  <li>선택 정보 입력 (주소, 대표자, 업태/업종 등)</li>
  <li><strong>등록</strong> 버튼으로 저장</li>
</ol>

<h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">일괄 업로드</h3>
<ol style="margin: 0 0 24px 0; padding-left: 24px; line-height: 1.8;">
  <li><strong>일괄 업로드</strong> 버튼 클릭</li>
  <li>Excel/CSV 템플릿 다운로드</li>
  <li>고객사 정보 입력</li>
  <li>파일 업로드</li>
  <li>검증 후 일괄 등록</li>
</ol>

<div style="padding: 12px 16px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px; margin-top: 16px;">
  <strong>💡 참고:</strong> 같은 사업자번호로 여러 사업장 생성 가능
</div>
      `.trim(),
    },
    {
      id: "invitation",
      title: "초대 링크 연결",
      content: `
<h3 style="margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600;">초대 링크 생성</h3>
<ol style="margin: 0 0 24px 0; padding-left: 24px; line-height: 1.8;">
  <li><strong>내부</strong> 탭에서 고객사 선택</li>
  <li><strong>초대 링크</strong> 버튼 클릭</li>
  <li>관리자 정보 입력:
    <ul style="margin: 8px 0; padding-left: 24px;">
      <li>이메일</li>
      <li>이름</li>
      <li>연락처</li>
      <li>권한 (관리자/일반)</li>
    </ul>
  </li>
  <li>유효기간 설정 (기본 7일)</li>
</ol>

<h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">기존 계정이 있는 경우</h3>
<div style="margin-bottom: 24px; line-height: 1.8;">
  <p style="margin: 0 0 12px 0;"><strong>같은 사업자번호 내 동일 이메일</strong>이 이미 가입되어 있으면:</p>
  <ul style="margin: 0; padding-left: 24px;">
    <li>초대 링크가 생성되지 않음</li>
    <li>안내 메시지 표시: "이미 연결된 계정입니다. 고객시스템에서 승인하면 자동 연결됩니다."</li>
    <li>고객사 시스템의 <strong>환경측정기업관리</strong> 메뉴에 승인 대기 상태로 표시</li>
    <li>고객이 승인하면 새 사업장 자동 연결</li>
  </ul>
</div>

<h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">기존 계정이 없는 경우</h3>
<ul style="margin: 0 0 24px 0; padding-left: 24px; line-height: 1.8;">
  <li>초대 링크 생성 및 표시</li>
  <li>링크 복사 버튼으로 클립보드에 복사</li>
  <li>이메일, 메신저, 문자 등으로 직접 전달</li>
  <li>고객이 링크로 접속하여 회원가입</li>
  <li>가입 완료 시 자동 연결</li>
</ul>

<div style="padding: 12px 16px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px; margin-top: 16px;">
  <strong>💡 참고:</strong><br/>
  • 같은 사업자번호의 다른 사업장에 이미 가입한 이메일은 자동 연결<br/>
  • 초대 링크는 유효기간 내 1회만 사용 가능
</div>
      `.trim(),
    },
    {
      id: "search",
      title: "검색 연결",
      content: `
<h3 style="margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600;">신규 검색 연결</h3>
<ol style="margin: 0 0 24px 0; padding-left: 24px; line-height: 1.8;">
  <li><strong>연결</strong> 탭으로 이동</li>
  <li><strong>신규 검색 연결</strong> 버튼 클릭</li>
  <li>고객사 유형 선택:
    <ul style="margin: 8px 0; padding-left: 24px;">
      <li><strong>고객사(가입)</strong>: 이미 시스템에 가입한 고객사</li>
      <li><strong>고객사(내부)</strong>: 내부에서 생성한 미연결 고객사</li>
    </ul>
  </li>
  <li>검색 조건 입력 (고객사명, 사업자번호 등)</li>
  <li>검색 결과에서 선택</li>
  <li><strong>연결 요청</strong> 버튼 클릭</li>
</ol>

<h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">연결 승인</h3>
<ul style="margin: 0 0 24px 0; padding-left: 24px; line-height: 1.8;">
  <li>고객사 시스템에서 연결 요청 확인</li>
  <li>고객이 승인하면 연결 완료</li>
  <li><strong>연결</strong> 탭에서 연결 상태 확인</li>
</ul>

<div style="padding: 12px 16px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px; margin-top: 16px;">
  <strong>💡 참고:</strong><br/>
  • 고객사(가입): 이미 다른 환경측정기업과 연결된 고객사<br/>
  • 고객사(내부): 아직 연결되지 않은 내부 생성 고객사
</div>
      `.trim(),
    },
    {
      id: "management",
      title: "관리 기능",
      content: `
<h3 style="margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600;">수정</h3>
<ul style="margin: 0 0 24px 0; padding-left: 24px; line-height: 1.8;">
  <li>각 고객사 행의 <strong>수정</strong> 버튼 클릭</li>
  <li>정보 수정 후 저장</li>
  <li>수정 시 고객사에 알림 전송</li>
</ul>

<h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">비활성화</h3>
<ul style="margin: 0 0 24px 0; padding-left: 24px; line-height: 1.8;">
  <li><strong>비활성화</strong> 버튼으로 일시 중지</li>
  <li>비활성 상태에서도 데이터 유지</li>
  <li><strong>활성화</strong> 버튼으로 재활성화 가능</li>
</ul>

<h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">삭제</h3>
<ul style="margin: 0 0 24px 0; padding-left: 24px; line-height: 1.8;">
  <li>비활성화된 고객사만 삭제 가능</li>
  <li>측정 기록이 있으면 삭제 불가</li>
  <li><strong>삭제</strong> 버튼 클릭 후 확인</li>
</ul>

<h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">연결 해제</h3>
<ul style="margin: 0 0 24px 0; padding-left: 24px; line-height: 1.8;">
  <li><strong>연결</strong> 탭에서 연결 해제 가능</li>
  <li>연결 해제 시 고객사 데이터는 유지</li>
  <li>재연결 가능</li>
</ul>

<h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">탭별 필터</h3>
<ul style="margin: 0 0 24px 0; padding-left: 24px; line-height: 1.8;">
  <li><strong>전체</strong>: 모든 고객사 (생성 + 연결)</li>
  <li><strong>내부</strong>: 내부 생성 미연결 고객사</li>
  <li><strong>연결</strong>: 연결 완료된 고객사</li>
</ul>

<div style="padding: 12px 16px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px; margin-top: 16px;">
  <strong>💡 참고:</strong><br/>
  • 같은 사업자번호의 여러 사업장은 그룹으로 표시<br/>
  • 각 사업장은 독립적으로 관리 가능
</div>
      `.trim(),
    },
  ];
}
