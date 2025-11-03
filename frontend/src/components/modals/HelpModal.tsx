"use client";

import { useState } from "react";

interface Section {
  title: string;
  content: string | React.ReactNode;
}

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sections: Section[];
}

export default function HelpModal({ isOpen, onClose, title, sections }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* 배경 오버레이 */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* 모달 컨텐츠 */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                  📚
                </div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          {sections.length > 1 && (
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <nav className="flex -mb-px overflow-x-auto">
                {sections.map((section, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTab(index)}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === index
                        ? "border-blue-600 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          )}

          {/* 컨텐츠 */}
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            <div className="prose dark:prose-invert max-w-none">
              {typeof sections[activeTab].content === 'string' ? (
                <div dangerouslySetInnerHTML={{ __html: sections[activeTab].content }} />
              ) : (
                sections[activeTab].content
              )}
            </div>
          </div>

          {/* 푸터 */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-between items-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              💡 추가 도움이 필요하시면 시스템 관리자에게 문의하세요.
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
