import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
  if (!session) {
    redirect("/login");
  }

  // 로그인된 경우 대시보드로 리다이렉트
  redirect("/dashboard");
}
