import React from "react";

export function Table({ className = "", ...rest }: React.HTMLAttributes<HTMLTableElement>) {
  return <table className={`w-full text-sm border-collapse ${className}`} {...rest} />;
}
export function Thead(props: React.HTMLAttributes<HTMLTableSectionElement>) { return <thead {...props} />; }
export function Tbody(props: React.HTMLAttributes<HTMLTableSectionElement>) { return <tbody {...props} />; }
export function Tr(props: React.HTMLAttributes<HTMLTableRowElement>) { return <tr className={`border-b last:border-0 border-gray-200 dark:border-white/10`} {...props} />; }
export function Th({ className = "", ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) { return <th className={`text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-300 ${className}`} {...rest} />; }
export function Td({ className = "", ...rest }: React.TdHTMLAttributes<HTMLTableCellElement>) { return <td className={`py-2 px-3 ${className}`} {...rest} />; }
