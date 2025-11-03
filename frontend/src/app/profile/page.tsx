"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  status: string;
  companyName: string | null;
  businessNumber: string | null;
  department: string | null;
  position: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  loginCount: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    department: "",
    position: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userId = (session?.user as any)?.id;
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();

      if (response.ok) {
        setProfile(data.user);
        setFormData({
          name: data.user.name,
          phone: data.user.phone || "",
          department: data.user.department || "",
          position: data.user.position || "",
        });
      } else {
        setError(data.error || "프로필을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("Fetch profile error:", error);
      setError("프로필을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const userId = (session?.user as any)?.id;
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("프로필이 수정되었습니다.");
        setEditing(false);
        fetchProfile();
      } else {
        setError(data.error || "프로필 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Update profile error:", error);
      setError("프로필 수정 중 오류가 발생했습니다.");
    }
  };

  const getRoleName = (role: string) => {
    const roles: any = {
      SUPER_ADMIN: "시스템 관리자 (티그로)",
      ORG_ADMIN: "환경측정기업 관리자",
      OPERATOR: "환경측정기업 임직원",
      CUSTOMER_ADMIN: "고객사 관리자",
      CUSTOMER_USER: "고객사 사용자",
    };
    return roles[role] || role;
  };

  const getStatusName = (status: string) => {
    const statuses: any = {
      PENDING: "승인 대기",
      APPROVED: "승인됨",
      REJECTED: "거부됨",
      SUSPENDED: "정지됨",
      WITHDRAWN: "탈퇴",
    };
    return statuses[status] || status;
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">프로필을 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">내 정보</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          개인 정보를 확인하고 수정할 수 있습니다.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="text-sm font-medium text-red-800 dark:text-red-200">{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 p-4">
          <div className="text-sm font-medium text-green-800 dark:text-green-200">{success}</div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* 계정 정보 (읽기 전용) */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">계정 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                이메일
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                {profile.email}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                역할
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                {getRoleName(profile.role)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                계정 상태
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                {getStatusName(profile.status)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                가입일
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                {new Date(profile.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                마지막 로그인
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                {profile.lastLoginAt
                  ? new Date(profile.lastLoginAt).toLocaleString()
                  : "없음"}
              </div>
            </div>
          </div>
        </div>

        {/* 개인 정보 (수정 가능) */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">개인 정보</h2>
            {!editing && (
              <Button
                onClick={() => setEditing(true)}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                수정
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  이름
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  전화번호
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full"
                />
              </div>

              {profile.companyName && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      법인명
                    </label>
                    <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      {profile.companyName || "-"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      사업자등록번호
                    </label>
                    <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      {profile.businessNumber || "-"}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="department"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  부서
                </label>
                <Input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="position"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  직책
                </label>
                <Input
                  id="position"
                  name="position"
                  type="text"
                  value={formData.position}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full"
                />
              </div>
            </div>

            {editing && (
              <div className="mt-6 flex gap-2">
                <Button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  저장
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: profile.name,
                      phone: profile.phone || "",
                      department: profile.department || "",
                      position: profile.position || "",
                    });
                  }}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md"
                >
                  취소
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
