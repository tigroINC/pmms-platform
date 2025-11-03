"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

interface InvitationData {
  id: string;
  customer: {
    id: string;
    name: string;
    fullName: string;
    businessNumber: string;
    address: string;
    industry: string;
  };
  organization: {
    id: string;
    name: string;
    businessNumber: string;
  };
  adminEmail: string | null;
  adminName: string | null;
  adminPhone: string | null;
  suggestedRole: string | null;
  roleNote: string | null;
  expiresAt: string;
}

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState("");

  // 회원가입 폼
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState(""); // ADMIN or USER
  const [businessNumber, setBusinessNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customer-invitations/${token}`);
      const data = await res.json();

      if (res.ok) {
        setInvitation(data.invitation);
        // 미리 입력된 정보가 있으면 자동 채우기
        if (data.invitation.adminEmail) {
          setEmail(data.invitation.adminEmail);
        }
        if (data.invitation.adminName) {
          setName(data.invitation.adminName);
        }
        if (data.invitation.adminPhone) {
          setPhone(data.invitation.adminPhone);
        }
        // suggestedRole을 기본값으로 설정
        if (data.invitation.suggestedRole) {
          setRole(data.invitation.suggestedRole);
        }
        // businessNumber 자동 채우기
        if (data.invitation.customer.businessNumber) {
          setBusinessNumber(data.invitation.customer.businessNumber);
        }
      } else {
        setError(data.error || "초대 정보를 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("Error fetching invitation:", error);
      setError("초대 정보 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!email || !password || !name || !phone) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 8) {
      alert("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/customer-invitations/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          phone,
          role: role || "ADMIN",
          businessNumber: businessNumber.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("가입이 완료되었습니다! 로그인해주세요.");
        router.push("/login");
      } else {
        alert(data.error || "가입 실패");
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      alert("가입 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">초대 링크 오류</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              홈으로 이동
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {/* 초대 정보 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">고객사 초대</h2>
            <p className="text-gray-600">
              <span className="font-semibold text-blue-600">{invitation.organization.name}</span>에서
              귀하를 초대했습니다
            </p>
          </div>

          <div className="border-t border-b border-gray-200 py-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">고객사</div>
                <div className="font-medium">{invitation.customer.name}</div>
                {invitation.customer.fullName && (
                  <div className="text-sm text-gray-600">{invitation.customer.fullName}</div>
                )}
              </div>
              <div>
                <div className="text-sm text-gray-500">사업자등록번호</div>
                <div className="font-medium">{invitation.customer.businessNumber}</div>
              </div>
              {invitation.customer.industry && (
                <div>
                  <div className="text-sm text-gray-500">업종</div>
                  <div className="font-medium">{invitation.customer.industry}</div>
                </div>
              )}
              {invitation.customer.address && (
                <div className="col-span-2">
                  <div className="text-sm text-gray-500">주소</div>
                  <div className="font-medium">{invitation.customer.address}</div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-800">
              💡 회원가입을 완료하면 <strong>{invitation.organization.name}</strong>와 자동으로 연결되며,
              측정 데이터를 실시간으로 확인할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 회원가입 폼 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">회원가입</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일 *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="example@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="홍길동"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                전화번호 *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="010-1234-5678"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                역할 선택 *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="ADMIN"
                    checked={role === "ADMIN" || (!role && invitation?.suggestedRole === "ADMIN")}
                    onChange={(e) => setRole(e.target.value)}
                    className="mr-2"
                  />
                  <span>관리자 (CUSTOMER_ADMIN)</span>
                  {invitation?.suggestedRole === "ADMIN" && (
                    <span className="ml-2 text-xs text-blue-600">(권장)</span>
                  )}
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="USER"
                    checked={role === "USER" || (!role && invitation?.suggestedRole === "USER")}
                    onChange={(e) => setRole(e.target.value)}
                    className="mr-2"
                  />
                  <span>일반 사용자 (CUSTOMER_USER)</span>
                  {invitation?.suggestedRole === "USER" && (
                    <span className="ml-2 text-xs text-blue-600">(권장)</span>
                  )}
                </label>
              </div>
              {invitation?.roleNote && (
                <p className="text-xs text-gray-500 mt-1">
                  힌트: {invitation.roleNote}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사업자등록번호 (선택)
              </label>
              <input
                type="text"
                value={businessNumber}
                onChange={(e) => setBusinessNumber(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="123-45-67890"
              />
              <p className="text-xs text-gray-500 mt-1">
                모르면 비워두세요. 나중에 추가할 수 있습니다.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 * (최소 8자)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="••••••••"
                minLength={8}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 확인 *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="••••••••"
                minLength={8}
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400"
              >
                {submitting ? "가입 중..." : "회원가입 및 연결하기"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{" "}
            <a href="/login" className="text-blue-600 hover:text-blue-700">
              로그인
            </a>
          </div>
        </div>

        {/* 만료 안내 */}
        <div className="mt-4 text-center text-sm text-gray-500">
          이 초대 링크는 {new Date(invitation.expiresAt).toLocaleDateString()}까지 유효합니다.
        </div>
      </div>
    </div>
  );
}
