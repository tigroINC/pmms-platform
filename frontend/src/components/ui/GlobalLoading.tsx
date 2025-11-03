"use client";

/**
 * 전역 로딩 화면
 * 인증 로딩 중일 때 표시되는 깔끔한 로딩 화면
 */
export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      {/* 상단 타이틀 */}
      <div className="mb-16">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center">
          오염물질 측정 관리 시스템
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Pollutant Measurement Management System
        </p>
      </div>

      {/* 로딩 스피너 */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* 회전하는 원 */}
          <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        
        {/* 로딩 텍스트 */}
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
          로딩 중...
        </p>
      </div>

      {/* 하단 여백 */}
      <div className="mt-16"></div>
    </div>
  );
}
