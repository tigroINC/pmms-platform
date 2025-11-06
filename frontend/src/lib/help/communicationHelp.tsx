export function getCommunicationHelpSections() {
  return [
    {
      title: "📌 빠른 시작",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">등록 4단계</h3>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li className="text-gray-700 dark:text-gray-300"><strong>[+ 등록]</strong> 버튼 클릭</li>
              <li className="text-gray-700 dark:text-gray-300">
                <strong>공유 범위 선택</strong> ⭐ 중요
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>◉ 고객사 공유 = 고객이 시스템에서 볼 수 있음</li>
                  <li>○ 내부 전용 = 우리만 봄</li>
                </ul>
              </li>
              <li className="text-gray-700 dark:text-gray-300">고객사 + 소통 내용 입력</li>
              <li className="text-gray-700 dark:text-gray-300"><strong>[등록]</strong> 클릭 → 완료!</li>
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">💡 핵심 Tip</h4>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• 전화 받으면 바로 등록 (나중엔 까먹음)</li>
              <li>• 공유 범위 신중히 선택 (되돌릴 수 없음)</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "📝 공유 범위",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">두 가지 선택지</h3>
            
            <div className="space-y-4">
              <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                <h4 className="font-bold text-green-900 dark:text-green-300 mb-2">◉ 고객사 공유</h4>
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li>• 고객사가 시스템에서 확인 가능</li>
                  <li>• 대화 내역(Reply)도 함께 공유됨</li>
                  <li>• 사용: 공식 소통, 일정 안내, 보고서 발송 등</li>
                </ul>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/20">
                <h4 className="font-bold text-gray-900 dark:text-gray-300 mb-2">○ 내부 전용</h4>
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li>• 우리 조직만 확인 가능</li>
                  <li>• 고객사는 절대 못 봄</li>
                  <li>• 사용: 내부 협의, 민감 정보, 전략 논의</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h4 className="font-bold text-red-900 dark:text-red-300 mb-2">⚠️ 주의사항</h4>
            <ul className="space-y-1 text-sm text-red-800 dark:text-red-200">
              <li>• 내부 전용 → 고객사 공유: ✅ 변경 가능</li>
              <li>• 고객사 공유 → 내부 전용: ❌ 변경 불가!</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-bold text-yellow-900 dark:text-yellow-300 mb-2">등록 전 체크리스트</h4>
            <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
              <li>[ ] 고객사가 봐도 되는 내용인가?</li>
              <li>[ ] 민감한 내부 의견이 포함됐나?</li>
              <li>[ ] 확실하지 않으면 "내부 전용"으로 시작</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "💬 답변하기",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">2열 화면 구조</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">💬 대화 내역</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">(고객사 공유)</p>
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li>✅ 고객이 봄</li>
                  <li>• 공식 답변</li>
                  <li>• 일정 안내</li>
                  <li>• 결과 설명</li>
                </ul>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/20">
                <h4 className="font-bold text-gray-900 dark:text-gray-300 mb-2">🔒 내부 메모</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">(비공개)</p>
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li>❌ 고객 못 봄</li>
                  <li>• 업무 메모</li>
                  <li>• 특이사항</li>
                  <li>• 인수인계</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h4 className="font-bold text-red-900 dark:text-red-300 mb-2">실수 예방</h4>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-red-700 dark:text-red-300 font-medium">❌ 나쁜 예 (대화 내역에 작성):</p>
                <p className="text-red-600 dark:text-red-400">"이 고객 진짜 까다롭네요"</p>
              </div>
              <div>
                <p className="text-green-700 dark:text-green-300 font-medium">✅ 좋은 예:</p>
                <p className="text-gray-600 dark:text-gray-400">대화 내역: "확인했습니다. 조치하겠습니다"</p>
                <p className="text-gray-600 dark:text-gray-400">내부 메모: "고객 불만 많음. 다음 측정 시 특별 주의"</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "🔍 조회 및 필터",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">필터 기능</h3>
            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded p-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">필터: 고객사 / 상태 / 채널 / 기간</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">상태 구분</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">답변대기</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">아직 답변 안 함</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">대화중</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">답변 진행 중</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">완료</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">답변 완료 (더 이상 답변 불가)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">참고</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">단순 기록용</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "⚙️ 상태 관리",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">상태 변경</h3>
            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded p-4">
              <p className="text-center text-gray-700 dark:text-gray-300 font-medium">
                답변대기 → 대화중 → 완료
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-bold text-yellow-900 dark:text-yellow-300 mb-2">완료 처리 시점</h4>
            <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
              <li>✅ 고객 질문 완전 해결</li>
              <li>✅ 더 이상 답변 필요 없음</li>
              <li>⚠️ 완료 후 답변 추가 불가!</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">담당자 배정</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              등록 시 또는 상세 화면에서 담당자 지정 → 해당 직원에게 자동 알림 발송
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-300 mb-2">활용 예시</p>
              <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                <li>• 복잡한 기술 문의 → 측정팀장에게 배정</li>
                <li>• 계약 관련 문의 → 영업팀에게 배정</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "📝 등록 항목",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">반드시 입력</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">고객사 선택</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">소통 일시</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">채널 (📞전화 📧이메일 👤방문 💬카톡 등)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">상대방 조직명</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">상대방 담당자명</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">내용</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">우선순위 기준</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>🔴</span>
                <span className="font-medium">긴급:</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">배출기준 초과, 긴급 측정</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🟠</span>
                <span className="font-medium">높음:</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">일정 변경, 보고서 정정</span>
              </div>
              <div className="flex items-center gap-2">
                <span>⚪</span>
                <span className="font-medium">보통:</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">일반 문의 (기본값)</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🔵</span>
                <span className="font-medium">낮음:</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">단순 안내</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "❓ FAQ",
      content: (
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h4 className="font-bold mb-2">Q1. 내부 메모는 정말 고객이 못 보나요?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">A: 네, 절대 못 봅니다. 100% 비공개입니다.</p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-bold mb-2">Q2. 등록 후 수정할 수 있나요?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">A: 본인 작성 + 답변 없는 경우만 가능합니다.</p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-bold mb-2">Q3. 완료 후 추가 소통이 생기면?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">A: 새 커뮤니케이션을 등록하세요. 완료 건은 답변 추가 불가합니다.</p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-bold mb-2">Q4. 고객사 공유를 내부 전용으로 바꿀 수 있나요?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">A: 불가능합니다. 한번 공유하면 되돌릴 수 없습니다.</p>
          </div>
          <div className="pb-4">
            <h4 className="font-bold mb-2">Q5. 측정 결과와 연결할 수 있나요?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">A: 네. 등록 시 측정 또는 굴뚝을 선택하여 연결할 수 있습니다.</p>
          </div>
        </div>
      )
    },
    {
      title: "🎯 실무 팁",
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Tip 1: 전화 → 즉시 등록</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              통화 종료 후 5분 이내 등록! 나중에 하려면 100% 까먹습니다 😅
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-bold text-green-900 dark:text-green-300 mb-2">Tip 2: 공유 범위 전략</h4>
            <p className="text-sm text-green-800 dark:text-green-200">
              확실하지 않으면 → "내부 전용"으로 시작<br/>
              나중에 "고객사 공유"로 변경 가능
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-2">Tip 3: 상대방 정보 상세히</h4>
            <div className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
              <p>❌ "홍길동"</p>
              <p>✅ "홍길동 과장 (환경안전팀)"</p>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <h4 className="font-bold text-orange-900 dark:text-orange-300 mb-2">Tip 4: 담당자 배정 활용</h4>
            <p className="text-sm text-orange-800 dark:text-orange-200">
              내가 처리 못하는 전문 문의는 등록 시 전문가에게 배정하면 자동 알림 발송됨
            </p>
          </div>
        </div>
      )
    }
  ];
}
