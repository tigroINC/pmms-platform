"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [loading, setLoading] = useState(true);
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/auth/verify-invite?token=${token}`);
      const data = await response.json();

      if (response.ok) {
        setInviteInfo(data);
      } else {
        alert(data.error || "유효하지 않은 초대 링크입니다.");
      }
    } catch (error) {
      console.error("Verify token error:", error);
      alert("초대 정보를 확인하는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      alert("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("계정이 활성화되었습니다. 로그인해주세요.");
        router.push("/login");
      } else {
        alert(data.error || "계정 활성화에 실패했습니다.");
      }
    } catch (error) {
      console.error("Accept invite error:", error);
      alert("계정 활성화 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!token || !inviteInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">유효하지 않은 초대</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            초대 링크가 유효하지 않거나 만료되었습니다.
          </p>
          <Button onClick={() => router.push("/login")} className="w-full">
            로그인 페이지로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎉 초대를 환영합니다!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            계정을 활성화하려면 비밀번호를 설정해주세요.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>초대 정보:</strong>
          </p>
          <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
            <li>• 이름: {inviteInfo.name}</li>
            <li>• 이메일: {inviteInfo.email}</li>
            <li>• 회사: {inviteInfo.organizationName}</li>
            <li>• 역할: {inviteInfo.roleName}</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="최소 8자 이상"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              비밀번호 확인 <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              required
              minLength={8}
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              💡 <strong>비밀번호 요구사항:</strong>
            </p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-1">
              <li>• 최소 8자 이상</li>
              <li>• 영문, 숫자, 특수문자 조합 권장</li>
            </ul>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "처리 중..." : "계정 활성화"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
