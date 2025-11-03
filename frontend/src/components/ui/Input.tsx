"use client";
import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = "", ...rest }: Props) {
  const base = "rounded-md border bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-white/20";
  return <input className={`${base} ${className}`} {...rest} />;
}
