export function getMeasurementInputHelpSections() {
  return [
    {
      title: "📌 빠른 시작",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">측정 데이터 입력 3단계</h3>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li className="text-gray-700 dark:text-gray-300">
                <strong>날짜/고객사/굴뚝 선택</strong>
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>측정일, 측정시간 입력</li>
                  <li>고객사와 굴뚝 선택</li>
                  <li>과거 측정이력 기반으로 항목 자동 표시</li>
                </ul>
              </li>
              <li className="text-gray-700 dark:text-gray-300">
                <strong>채취환경 입력 (상단 파란 박스)</strong>
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>기상, 풍향, 기온 등 입력</li>
                  <li>각 항목별 [임시저장] 클릭</li>
                </ul>
              </li>
              <li className="text-gray-700 dark:text-gray-300">
                <strong>오염물질 입력</strong>
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>먼지, SOx, NOx 등 측정값 입력</li>
                  <li>각 항목별 [임시저장] 클릭</li>
                </ul>
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">💡 핵심 Tip</h4>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• 채취환경은 오염물질 전/후 언제든 입력 가능 (자동 적용)</li>
              <li>• 임시저장 → 임시데이터관리 탭에서 체크박스 선택 → 확정 버튼 클릭</li>
              <li>• 측정항목 변경은 [측정항목] 메뉴에서</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "📋 측정할 항목 설정",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">자동 표시 방식</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              굴뚝을 선택하면 <strong>과거 측정이력을 기반</strong>으로 측정 항목이 자동으로 표시됩니다.
            </p>
            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded p-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                예: A 굴뚝에서 과거에 먼지, SOx, NOx를 측정했다면<br/>
                → A 굴뚝 선택 시 자동으로 먼지, SOx, NOx 항목이 표시됨
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">측정항목 변경이 필요한 경우</h3>
            <div className="space-y-3">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-300 mb-2">
                  다음과 같은 경우 측정항목 설정이 필요합니다:
                </p>
                <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                  <li>• 신규 항목 추가 (예: 암모니아 측정 시작)</li>
                  <li>• 기존 항목 제거 (예: 더 이상 측정하지 않는 항목)</li>
                  <li>• 처음 측정하는 굴뚝 (측정이력 없음)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 dark:text-gray-300 mb-2">설정 방법</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li><strong>[측정항목]</strong> 메뉴로 이동</li>
                  <li><strong>[굴뚝별 측정 대상 설정]</strong> 탭 선택</li>
                  <li>고객사와 굴뚝 선택</li>
                  <li>측정할 항목 체크/해제</li>
                  <li>[저장] 버튼 클릭</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">💡 Tip</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              측정항목 설정은 한 번만 하면 됩니다.<br/>
              이후 해당 굴뚝 선택 시 설정한 항목이 자동으로 표시됩니다.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "🌡️ 채취환경 입력",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">채취환경이란?</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              측정 당시의 환경 조건으로, 모든 오염물질 측정에 공통으로 적용됩니다.
            </p>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• 기상, 기온, 습도, 기압</li>
              <li>• 풍향, 풍속</li>
              <li>• 가스속도, 가스온도, 수분함량</li>
              <li>• 산소농도, 배출가스유량 등</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">입력 방법</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>상단 파란색 박스의 채취환경 항목 확인</li>
              <li>각 항목에 측정값 입력</li>
              <li>항목별 [임시저장] 버튼 클릭</li>
            </ol>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-bold text-green-900 dark:text-green-300 mb-2">✨ 자동 적용 기능</h4>
            <p className="text-sm text-green-800 dark:text-green-200">
              채취환경을 저장하면 <strong>동일 날짜/동일 굴뚝</strong>의 모든 임시데이터에 자동으로 적용됩니다.<br/>
              예: 기상을 "맑음"으로 저장 → 해당 날짜의 모든 오염물질 데이터에 "맑음" 적용
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-bold text-yellow-900 dark:text-yellow-300 mb-2">⚠️ 주의사항</h4>
            <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
              <li>• 오염물질 저장 시 같은 날짜의 채취환경 자동 포함</li>
              <li>• 채취환경 수정 시 동일 날짜/굴뚝의 오염물질 데이터에 자동 반영</li>
              <li>• 확정 후에는 측정이력 메뉴에서 수정 가능</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "🏭 오염물질 입력",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">입력 방법</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>오염물질 항목에 측정값 입력</li>
              <li>각 항목별 [임시저장] 버튼 클릭</li>
              <li>저장되면 버튼이 [재저장]으로 변경됨</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">채취환경 자동 적용</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              오염물질을 임시저장하면 현재 입력된 채취환경 값이 자동으로 함께 저장됩니다.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 채취환경 없이 오염물질만 저장해도 됩니다.<br/>
                나중에 채취환경을 입력하면 자동으로 업데이트됩니다.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">유효성 검사</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">숫자 항목: 올바른 숫자 형식 확인</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">선택 항목: 드롭다운에서 선택</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">배출허용기준 초과 시 경고 표시</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">⚠️</span>
                <span className="text-gray-700 dark:text-gray-300">AI 기반 이상치 검증 (예상 범위 벗어날 시 워닝)</span>
              </li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-2">🤖 AI 이상치 검증</h4>
            <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
              측정값 입력 시 AI가 과거 데이터를 분석하여 예상 범위를 벗어난 값을 자동으로 감지합니다.
            </p>
            <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
              <li>• 워닝 메시지가 표시되면 측정 장비와 조건을 재확인하세요</li>
              <li>• 실제로 높은 값이 맞다면 "확인하고 저장" 클릭</li>
              <li>• 데이터가 10개 미만인 경우 검증이 생략됩니다</li>
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded p-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-300 mb-2">불검출(ND) 처리</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              측정값이 검출한계 미만인 경우 "불검출(전체)" 체크박스를 선택하면<br/>
              모든 항목이 ND로 처리됩니다.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "📋 임시데이터 관리",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">임시저장 후 확인</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>[임시데이터관리] 탭 클릭</li>
              <li>저장된 데이터 목록 확인</li>
              <li>확정할 항목 체크박스 선택</li>
              <li>[확정] 버튼 클릭 → 측정이력에 자동 반영</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">확정 방법 2가지</h3>
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">방법 1: 직접 확정 (권장)</h4>
                <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <li>• 임시데이터관리 탭에서 체크박스 선택</li>
                  <li>• [확정] 버튼 클릭</li>
                  <li>• 즉시 측정이력에 반영</li>
                </ul>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded p-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-300 mb-2">방법 2: Excel 다운로드 후 일괄업로드</h4>
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li>• [Excel] 버튼으로 다운로드</li>
                  <li>• Excel에서 수정 필요 시 편집</li>
                  <li>• [확정일괄업로드] 탭에서 업로드</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">채취환경만 표시 기능</h3>
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded p-3">
              <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
                <strong>채취환경만 표시</strong> 체크박스를 활성화하면 오염물질 없이 채취환경만 저장된 데이터를 확인할 수 있습니다.
              </p>
              <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
                <li>• 기본적으로 오염물질 데이터만 표시됨</li>
                <li>• 채취환경만 있는 데이터는 확정 시 자동 제외됨</li>
                <li>• 필요 시 체크하여 확인 후 삭제 가능</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">기타 기능</h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• <strong>[Excel]</strong>: 선택한 항목 또는 전체 다운로드</li>
              <li>• <strong>[삭제]</strong>: 선택한 임시데이터 삭제</li>
              <li>• 필터: 고객사, 굴뚝, 기간별 조회</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-bold text-yellow-900 dark:text-yellow-300 mb-2">⚠️ 주의</h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              임시데이터는 아직 확정되지 않은 상태입니다.<br/>
              확정 버튼을 클릭해야 측정이력 및 대시보드에 반영됩니다.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "📤 확정 일괄업로드",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">업로드 절차</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>[확정일괄업로드] 탭 클릭</li>
              <li>[📤 파일 업로드] 버튼 클릭</li>
              <li>검토/수정한 Excel 파일 선택</li>
              <li>업로드 완료 → 측정이력에 자동 반영</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">Excel 파일 형식</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              임시데이터관리 탭에서 다운로드한 Excel 파일을 그대로 사용할 수 있습니다.
            </p>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• 컬럼 순서 및 이름 변경 금지</li>
              <li>• 측정값만 수정 가능</li>
              <li>• 행 추가/삭제 가능</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-bold text-green-900 dark:text-green-300 mb-2">✅ 확정 후</h4>
            <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
              <li>• 측정이력 메뉴에서 조회 가능</li>
              <li>• 대시보드에 자동 반영</li>
              <li>• 고객사도 조회 가능</li>
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
            <h4 className="font-bold mb-2">Q1. 측정할 항목이 표시되지 않아요</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A: 과거 측정이력이 없거나 측정항목 설정이 필요합니다.<br/>
              [측정항목] 메뉴 → [굴뚝별 측정 대상 설정]에서 항목을 설정하세요.
            </p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-bold mb-2">Q2. 채취환경을 나중에 입력해도 되나요?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A: 네, 가능합니다. 오염물질 저장 시 같은 날짜의 채취환경이 자동으로 포함되며,<br/>
              나중에 채취환경을 입력/수정하면 동일 날짜/굴뚝의 오염물질 데이터에 자동 반영됩니다.
            </p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-bold mb-2">Q3. 임시저장한 데이터를 수정하려면?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A: 같은 날짜/굴뚝/항목으로 다시 임시저장하면 기존 값이 업데이트됩니다.<br/>
              또는 [임시데이터관리] 탭에서 삭제 후 다시 입력하세요.
            </p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-bold mb-2">Q4. 확정 후 수정이 가능한가요?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A: 네, [측정이력] 메뉴에서 수정 가능합니다.
            </p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-bold mb-2">Q5. 여러 굴뚝을 한 번에 입력할 수 있나요?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A: 현장임시입력은 굴뚝별로 입력합니다. 여러 굴뚝은 Excel 파일로 일괄 업로드하세요.
            </p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-bold mb-2">Q6. AI 이상치 워닝이 뜨는데 값이 맞아요</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A: 실제로 높은 값이 측정된 경우 "확인하고 저장" 버튼을 클릭하면 됩니다.<br/>
              AI는 과거 데이터 기반으로 예측하므로 실제 배출 상황이 변경된 경우 워닝이 표시될 수 있습니다.
            </p>
          </div>
          <div className="pb-4">
            <h4 className="font-bold mb-2">Q7. 채취환경만 있는 데이터가 임시데이터에 보여요</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A: "채취환경만 표시" 체크박스를 활성화하면 확인할 수 있습니다.<br/>
              이러한 데이터는 확정 시 자동으로 제외되며, 필요 시 삭제할 수 있습니다.<br/>
              기본적으로는 오염물질 데이터만 표시됩니다.
            </p>
          </div>
        </div>
      )
    }
  ];
}
