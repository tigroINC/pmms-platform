import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import SessionProvider from "@/components/providers/SessionProvider";
import { OrganizationProvider } from "@/contexts/OrganizationContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "PMMS - Platform for Measurement Management System",
  description: "환경측정 데이터 관리 플랫폼",
  icons: {
    icon: "/favicon.ico",
  },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}>
        <SessionProvider>
          <OrganizationProvider>
            <AppShell>{children}</AppShell>
          </OrganizationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
