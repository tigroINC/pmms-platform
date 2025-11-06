export function getCustomerCommunicationHelpSections() {
  return [
    {
      title: "📌 빠른 시작",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">문의 등록 4단계</h3>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li className="text-gray-700 dark:text-gray-300"><strong>[+ 요청 등록]</strong> 버튼 클릭</li>
              <li className="text-gray-700 dark:text-gray-300">
                기본 정보 입력
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>소통 일시, 채널</li>
                  <li>환경측정기업명, 담당자명</li>
                </ul>
              </li>
              <li className="text-gray-700 dark:text-gray-300">문의 내용 작성 (구체적으로!)</li>
              <li className="text-gray-700 dark:text-gray-300"><strong>[등록]</strong> 클릭 → 완료!</li>
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">💡 핵심 Tip</h4>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• 구체적으로 작성할수록 빠른 답변</li>
              <li>• 긴급하면 시스템 등록 + 전화 병행</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "📝 문의 등록",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">필수 입력 항목</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">소통 일시 (기본값: 지금)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">채널 (📞전화 📧이메일 👤방문 💬카톡 등)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">환경측정기업명</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">담당자명</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">내용</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">선택 입력</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-gray-400">⚪</span>
                <span className="text-gray-700 dark:text-gray-300">제목 (간단히 요약)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">⚪</span>
                <span className="text-gray-700 dark:text-gray-300">우선순위 (긴급/높음/보통/낮음)</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">잘 쓴 문의 예시</h3>
            <div className="space-y-3">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">❌ 나쁜 예:</p>
                <p className="text-sm text-red-600 dark:text-red-400">"측정 일정 변경 가능한가요?"</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">✅ 좋은 예:</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  제목: 11월 측정 일정 변경 요청<br/>
                  내용: 11월 8일(수) 예정된 1호 굴뚝 먼지 측정을<br/>
                  11월 12일(일)로 변경 가능한지 문의드립니다.<br/>
                  생산 일정 관계로 부득이하게 요청드립니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-bold text-yellow-900 dark:text-yellow-300 mb-2">작성 팁</h4>
            <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
              <li>📅 일정 관련: 기존/변경 희망 날짜 명시</li>
              <li>📄 보고서 관련: 보고서 날짜, 항목 명시</li>
              <li>🔬 측정 결과: 어느 굴뚝, 어떤 항목인지 명시</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "💬 답변 확인",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">답변 알림 받기</h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                🔔 답변이 달리면 알림 표시<br/>
                → 시스템 상단 알림 아이콘 확인<br/>
                → 이메일 알림 (설정에 따라)
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">상세 화면 구조</h3>
            <div className="space-y-3">
              <div className="border border-gray-300 dark:border-gray-600 rounded p-3 bg-gray-50 dark:bg-gray-900/20">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-300">📋 내 문의 내용</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">(제목, 내용, 일시, 담당자 등)</p>
              </div>
              <div className="border border-blue-300 dark:border-blue-600 rounded p-3 bg-blue-50 dark:bg-blue-900/20">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">💬 대화 내역</p>
                <div className="space-y-1 text-xs text-blue-700 dark:text-blue-200">
                  <p>[환경측정기업 담당자] 답변...</p>
                  <p>[나] 추가 질문...</p>
                  <p>[환경측정기업 담당자] 재답변...</p>
                </div>
                <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-xs text-blue-600 dark:text-blue-300">[추가 질문 입력창] → [전송] 버튼</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">추가 질문하기</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>답변 확인 후 추가 질문 있으면</li>
              <li>하단 입력창에 작성</li>
              <li>[전송] 버튼 클릭</li>
              <li>환경측정기업에 자동 알림</li>
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 Tip: 같은 주제면 새 문의 말고 기존 문의에 추가 질문!
            </p>
          </div>
        </div>
      )
    },
    {
      title: "🔍 문의 내역",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">상태 구분</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">답변대기</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">아직 답변 없음</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">대화중</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">답변 진행 중</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">완료</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">답변 완료됨</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">필터 사용</h3>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>• 최근 1개월 / 3개월 / 6개월</li>
              <li>• 답변대기만 보기</li>
              <li>• 완료된 것만 보기</li>
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded p-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-300 mb-2">빠른 확인</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              [대시보드] 화면 상단<br/>
              답변대기 2건 | 대화중 1건
            </p>
          </div>
        </div>
      )
    },
    {
      title: "📞 긴급한 경우",
      content: (
        <div className="space-y-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-lg font-bold text-red-900 dark:text-red-300 mb-3">시스템 + 전화 병행 ⭐</h3>
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">⚠️ 긴급 상황 (배출기준 초과 등)</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                <li>시스템에 문의 등록</li>
                <li>전화로 즉시 연락</li>
                <li>"시스템에 등록했는데 긴급합니다" 전달</li>
              </ol>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">일반 문의 답변 속도</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">일반 문의: 1~2일 이내</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">⚠️</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">복잡한 문의: 2~3일 소요 가능</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-600">🔴</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">긴급: 당일 답변 (전화 병행 권장)</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "📋 자주 하는 문의",
      content: (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="font-bold text-gray-900 dark:text-gray-300 mb-2">1. 측정 일정 조율</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>"11월 8일 측정 일정을 12일로 변경 가능한가요?"</li>
              <li>"다음 주 중 측정 가능한 날짜가 언제인가요?"</li>
            </ul>
          </div>
          <div className="border-b pb-3">
            <h4 className="font-bold text-gray-900 dark:text-gray-300 mb-2">2. 보고서 관련</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>"10월 보고서에서 PM10 수치 설명 부탁드립니다"</li>
              <li>"보고서 재발행 요청드립니다 (주소 오타)"</li>
              <li>"보고서는 언제쯤 받을 수 있나요?"</li>
            </ul>
          </div>
          <div className="border-b pb-3">
            <h4 className="font-bold text-gray-900 dark:text-gray-300 mb-2">3. 측정 준비 사항</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>"측정 시 준비해야 할 서류가 있나요?"</li>
              <li>"측정 당일 생산 중단해야 하나요?"</li>
              <li>"담당자가 입회해야 하나요?"</li>
            </ul>
          </div>
          <div className="border-b pb-3">
            <h4 className="font-bold text-gray-900 dark:text-gray-300 mb-2">4. 측정 결과 문의</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>"이번 측정에서 NOx 수치가 높은 이유가 뭔가요?"</li>
              <li>"배출허용기준 대비 어느 정도 수준인가요?"</li>
            </ul>
          </div>
          <div className="pb-3">
            <h4 className="font-bold text-gray-900 dark:text-gray-300 mb-2">5. 추가 측정 상담</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>"신규 배출구가 생겼는데 측정 필요한가요?"</li>
              <li>"배출시설 추가 시 어떤 절차가 필요한가요?"</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "❓ FAQ",
      content: (
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h4 className="font-bold mb-2">Q1. 등록한 문의를 수정/삭제할 수 있나요?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A: 답변이 없는 경우에만 수정/삭제 가능합니다. 답변이 달린 후에는 수정/삭제가 불가능합니다.
            </p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-bold mb-2">Q2. 답변이 언제쯤 오나요?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A: 일반적으로 1~2일 이내 답변합니다. 긴급한 경우 전화로도 연락 주세요.
            </p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-bold mb-2">Q3. 답변이 왔는지 어떻게 알 수 있나요?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A: 시스템 상단 🔔 알림 아이콘에 표시되고, 이메일 알림도 받을 수 있습니다.
            </p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-bold mb-2">Q4. 전화로 이미 문의했는데 시스템에도 등록해야 하나요?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A: 필수는 아니지만 권장합니다. 히스토리 관리에 도움됩니다.
            </p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-bold mb-2">Q5. 답변 완료 후 또 질문이 생기면?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A: 완료된 문의는 추가 질문이 불가능합니다. 새로운 문의를 등록해주세요.
            </p>
          </div>
          <div className="pb-4">
            <h4 className="font-bold mb-2">Q6. 여러 담당자가 답변할 수 있나요?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A: 네, 환경측정기업의 여러 담당자가 답변할 수 있습니다. 답변마다 이름이 표시됩니다.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "🎯 실무 팁",
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Tip 1: 전화 후에도 등록</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">전화로 문의 → 시스템에도 기록</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              이유: 히스토리 추적 가능 / 다른 담당자도 내용 파악 / 말로만 하면 까먹을 수 있음
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-bold text-green-900 dark:text-green-300 mb-2">Tip 2: 구체적으로 작성</h4>
            <div className="space-y-2 text-sm">
              <p className="text-red-700 dark:text-red-300">❌ "보고서 확인해주세요"</p>
              <p className="text-green-700 dark:text-green-300">
                ✅ "2024년 10월 측정 보고서 3페이지의 PM10 수치 457mg/Sm³에 대한 설명 부탁드립니다"
              </p>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-2">Tip 3: 관련 정보 함께</h4>
            <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
              <li>• 일정 변경: 기존 일정 + 변경 희망 일정</li>
              <li>• 보고서: 보고서 날짜 + 페이지 + 항목</li>
              <li>• 측정 결과: 굴뚝 번호 + 측정 항목</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-bold text-yellow-900 dark:text-yellow-300 mb-2">Tip 4: 우선순위 활용</h4>
            <div className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
              <p>🔴 긴급: 배출기준 초과, 당일 일정 변경</p>
              <p>🟠 높음: 보고서 정정, 측정 일정 변경</p>
              <p>⚪ 보통: 일반 문의 (기본값)</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-bold text-gray-900 dark:text-gray-300 mb-2">Tip 5: 답변 확인 표시</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              답변 받고 확인했으면 "확인했습니다. 감사합니다" 한 줄이라도 달기<br/>
              → 환경측정기업도 안심
            </p>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2">🚀 처음 사용자를 위한 한마디</h4>
            <p className="text-sm text-indigo-800 dark:text-indigo-200">
              어렵지 않습니다!<br/>
              이메일 쓰듯이 내용 작성하고 [등록] 버튼만 누르면 끝입니다.<br/>
              답변 오면 알림으로 알려드립니다 😊
            </p>
          </div>
        </div>
      )
    }
  ];
}
