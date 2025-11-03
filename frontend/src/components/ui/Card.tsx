import React from "react";

type Props = React.HTMLAttributes<HTMLDivElement> & { title?: string };

export default function Card({ title, className = "", children, ...rest }: Props) {
  return (
    <div className={`rounded-lg border bg-white/50 p-4 dark:bg-white/5 ${className}`} {...rest}>
      {title && <h3 className="mb-2 font-medium">{title}</h3>}
      {children}
    </div>
  );
}
