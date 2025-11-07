export function getMeasurementItemsHelpSections() {
  return [
    {
      title: "📌 빠른 시작",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">측정항목 등록 3단계</h3>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li className="text-gray-700 dark:text-gray-300">
                <strong>[+ 항목 등록]</strong> 버튼 클릭
              </li>
              <li className="text-gray-700 dark:text-gray-300">
                필수 정보 입력
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>항목코드 (예: dust, sox)</li>
                  <li>항목명 (예: 먼지, 황산화물)</li>
                  <li>단위 (예: mg/Sm³, ppm)</li>
                  <li>분류 (오염물질 / 채취환경)</li>
                </ul>
              </li>
              <li className="text-gray-700 dark:text-gray-300">
                <strong>[등록]</strong> 클릭 → 완료!
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">💡 핵심 Tip</h4>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• 항목 등록 후 [굴뚝별 측정 대상 설정]에서 활성화</li>
              <li>• 드롭다운 항목은 입력타입을 "select"로 설정</li>
              <li>• 측정입력 화면에 자동 반영됨</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "📝 측정항목 등록",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">필수 입력 항목</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>항목코드</strong>: 고유 식별자 (예: dust, sox, nox)
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>항목명(한글)</strong>: 화면에 표시될 이름
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>기본단위</strong>: mg/Sm³, ppm, ℃ 등
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>분류</strong>: 오염물질 또는 채취환경
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">선택 입력</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-gray-400">⚪</span>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>항목명(영문)</strong>: 영문 보고서용
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">⚪</span>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>항목분류</strong>: 무기물질, 유기물질 등
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">⚪</span>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>허용기준값</strong>: 배출허용기준 (오염물질만)
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">분류 구분</h3>
            <div className="space-y-3">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">🏭 오염물질</p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  먼지, SOx, NOx, CO 등 배출가스 측정 항목<br/>
                  → 측정입력 화면 하단에 표시
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">🌡️ 채취환경</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  기상, 기온, 풍향, 가스온도 등 측정 환경 정보<br/>
                  → 측정입력 화면 상단 파란 박스에 표시
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "⚙️ 굴뚝별 측정 대상 설정",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">자동 표시 방식</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              굴뚝을 선택하면 <strong>과거 측정이력을 기반</strong>으로 측정 항목이 자동으로 표시됩니다.
            </p>
            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded p-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                예: 1호 굴뚝에서 과거에 먼지, SOx를 측정했다면<br/>
                → 1호 굴뚝 선택 시 먼지, SOx가 자동으로 활성화됨
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">항목 추가/제거</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>[굴뚝별 측정 대상 설정] 탭 선택</li>
              <li>고객사와 굴뚝 선택</li>
              <li>활성화할 항목 체크 / 비활성화할 항목 체크 해제</li>
              <li>[저장] 버튼 클릭</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">순서 조정</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              측정입력 화면에서 항목이 표시되는 순서를 변경할 수 있습니다.
            </p>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• 순서 컬럼에 숫자 입력 (작은 숫자가 위에 표시)</li>
              <li>• 변경 후 자동 저장됨</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-bold text-yellow-900 dark:text-yellow-300 mb-2">🔄 전체 기준으로 초기화</h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              개별 설정을 삭제하고 전체 기본 항목으로 되돌립니다.<br/>
              [전체 기준으로 초기화] 버튼 클릭 → 확인
            </p>
          </div>
        </div>
      )
    },
    {
      title: "🔽 드롭다운 항목 설정",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">드롭다운이 필요한 경우</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              측정값을 직접 입력하지 않고 미리 정의된 값 중에서 선택하는 항목
            </p>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• 기상: 맑음, 흐림, 비, 눈</li>
              <li>• 풍향: 북, 북동, 동, 남동, 남, 남서, 서, 북서</li>
              <li>• 가동상태: 정상, 비정상</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">설정 방법</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>항목 등록 또는 수정 시</li>
              <li><strong>입력타입</strong>을 "select" 선택</li>
              <li><strong>선택옵션</strong>에 값 입력 (쉼표로 구분)</li>
              <li>저장</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">선택옵션 입력 예시</h3>
            <div className="space-y-3">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">✅ 올바른 예:</p>
                <p className="text-sm text-green-600 dark:text-green-400 font-mono">
                  맑음,흐림,비,눈
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">✅ 공백 포함 가능:</p>
                <p className="text-sm text-green-600 dark:text-green-400 font-mono">
                  북, 북동, 동, 남동, 남, 남서, 서, 북서
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">💡 Tip</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              드롭다운 항목은 측정입력 화면에서 선택 박스로 표시됩니다.<br/>
              숫자 유효성 검사가 적용되지 않습니다.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "📊 일괄업로드",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">업로드 절차</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>[📤 일괄업로드] 버튼 클릭</li>
              <li>양식 다운로드 (선택사항)</li>
              <li>CSV 파일 작성</li>
              <li>파일 선택 및 업로드</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">CSV 파일 형식</h3>
            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded p-3">
              <p className="text-xs font-mono text-gray-700 dark:text-gray-300">
                항목코드,항목명(한글),항목명(영문),기본단위,구분,항목분류,허용기준값(기본)<br/>
                dust,먼지,Dust,mg/Sm³,오염물질,무기물질,30<br/>
                weather,기상,Weather,,채취환경,,
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">필수 컬럼</h3>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• 항목코드</li>
              <li>• 항목명(한글)</li>
              <li>• 기본단위</li>
              <li>• 허용기준값(기본)</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-bold text-yellow-900 dark:text-yellow-300 mb-2">⚠️ 주의사항</h4>
            <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
              <li>• 구분은 "오염물질" 또는 "채취환경"만 입력</li>
              <li>• 항목코드가 중복되면 업데이트됨</li>
              <li>• CSV 파일은 UTF-8 인코딩 권장</li>
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
            <h4 className="font-bold mb-2">Q1. 항목을 등록했는데 측정입력 화면에 안 보여요</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A: [굴뚝별 측정 대상 설정] 탭에서 해당 굴뚝에 항목을 활성화해야 합니다.
            </p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-bold mb-2">Q2. 드롭다운 항목을 만들려면?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A: 항목 등록 시 입력타입을 "select"로 선택하고, 선택옵션에 값을 쉼표로 구분하여 입력하세요.
            </p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-bold mb-2">Q3. 항목 순서를 변경하려면?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A: [굴뚝별 측정 대상 설정]에서 순서 컬럼에 숫자를 입력하면 자동 저장됩니다.
            </p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-bold mb-2">Q4. 전체 기준으로 초기화하면 어떻게 되나요?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A: 해당 굴뚝의 개별 설정이 모두 삭제되고, 과거 측정이력 기반으로 자동 표시됩니다.
            </p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-bold mb-2">Q5. 채취환경 항목은 어디에 표시되나요?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A: 측정입력 화면 상단의 파란색 박스에 표시됩니다. 오염물질은 하단에 표시됩니다.
            </p>
          </div>
          <div className="pb-4">
            <h4 className="font-bold mb-2">Q6. 항목을 삭제할 수 있나요?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A: SUPER_ADMIN만 삭제 가능합니다. 일반적으로는 비활성화를 권장합니다.
            </p>
          </div>
        </div>
      )
    }
  ];
}
