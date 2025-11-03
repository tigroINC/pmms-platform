"use client";
import React from "react";

type Props = React.SelectHTMLAttributes<HTMLSelectElement>;

export default function Select({ className = "", children, ...rest }: Props) {
  const base = "w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-white/20";
  return (
    <select className={`${base} ${className}`} {...rest}>
      {children}
    </select>
  );
}

// CSS를 통한 option 스타일링은 브라우저 제약이 있으므로,
// 대시보드에서는 라이트 배경의 select를 사용하거나
// 커스텀 드롭다운 컴포넌트를 고려해야 합니다.
