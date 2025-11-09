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
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess("비밀번호가 변경되었습니다.");
        setChangingPassword(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setPasswordError(data.error || "비밀번호 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("Change password error:", error);
      setPasswordError("비밀번호 변경 중 오류가 발생했습니다.");
    }
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">내 정보</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
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

        {/* Desktop Table */}
        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">계정 정보</h2>
              {!editing && (
                <Button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  정보 수정
                </Button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">이메일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">이름</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">전화번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">역할</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">부서/직책</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">가입일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">마지막 로그인</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {profile.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {editing ? (
                      <Input
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full min-w-[100px]"
                      />
                    ) : (
                      profile.name
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {editing ? (
                      <Input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full min-w-[120px]"
                      />
                    ) : (
                      profile.phone || "-"
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {getRoleName(profile.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {editing ? (
                      <div className="space-y-1">
                        <Input
                          name="department"
                          type="text"
                          value={formData.department}
                          onChange={handleChange}
                          placeholder="부서"
                          className="w-full min-w-[100px]"
                        />
                        <Input
                          name="position"
                          type="text"
                          value={formData.position}
                          onChange={handleChange}
                          placeholder="직책"
                          className="w-full min-w-[100px]"
                        />
                      </div>
                    ) : (
                      <div>
                        {profile.department || "-"}
                        {profile.position && ` / ${profile.position}`}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {getStatusName(profile.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {profile.lastLoginAt
                      ? new Date(profile.lastLoginAt).toLocaleString()
                      : "없음"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {editing && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  저장
                </Button>
                <Button
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
            </div>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 mb-6">
          <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">계정 정보</h2>
              {!editing && (
                <Button
                  onClick={() => setEditing(true)}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  수정
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div><span className="text-gray-500">📧 이메일:</span> {profile.email}</div>
              <div>
                <span className="text-gray-500">👤 이름:</span>
                {editing ? (
                  <Input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full mt-1"
                  />
                ) : (
                  ` ${profile.name}`
                )}
              </div>
              <div>
                <span className="text-gray-500">📱 전화번호:</span>
                {editing ? (
                  <Input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full mt-1"
                  />
                ) : (
                  ` ${profile.phone || "-"}`
                )}
              </div>
              <div>
                <span className="text-gray-500">🎭 역할:</span>
                <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {getRoleName(profile.role)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">🏢 부서:</span>
                {editing ? (
                  <Input
                    name="department"
                    type="text"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full mt-1"
                  />
                ) : (
                  ` ${profile.department || "-"}`
                )}
              </div>
              <div>
                <span className="text-gray-500">💼 직책:</span>
                {editing ? (
                  <Input
                    name="position"
                    type="text"
                    value={formData.position}
                    onChange={handleChange}
                    className="w-full mt-1"
                  />
                ) : (
                  ` ${profile.position || "-"}`
                )}
              </div>
              <div>
                <span className="text-gray-500">✅ 상태:</span>
                <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {getStatusName(profile.status)}
                </span>
              </div>
              <div><span className="text-gray-500">📅 가입일:</span> {new Date(profile.createdAt).toLocaleDateString()}</div>
              <div><span className="text-gray-500">🕐 마지막 로그인:</span> {profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : "없음"}</div>
            </div>
            {editing && (
              <div className="flex flex-col gap-2 pt-2">
                <button onClick={handleSubmit} className="w-full px-3 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded text-sm">
                  저장
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: profile.name,
                      phone: profile.phone || "",
                      department: profile.department || "",
                      position: profile.position || "",
                    });
                  }}
                  className="w-full px-3 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded text-sm"
                >
                  취소
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 비밀번호 변경 */}
        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">비밀번호 변경</h2>
            {!changingPassword && (
              <Button
                onClick={() => setChangingPassword(true)}
                className="px-4 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded-md"
              >
                비밀번호 변경
              </Button>
            )}
          </div>

          {passwordSuccess && (
            <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 p-4">
              <div className="text-sm font-medium text-green-800 dark:text-green-200">
                {passwordSuccess}
              </div>
            </div>
          )}

          {changingPassword && (
            <form onSubmit={handlePasswordSubmit}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    현재 비밀번호
                  </label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="현재 비밀번호"
                    className="w-full"
                  />
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    새 비밀번호
                  </label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="새 비밀번호 (최소 8자)"
                    className="w-full"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    새 비밀번호 확인
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="새 비밀번호 확인"
                    className="w-full"
                  />
                </div>

                {passwordError && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                    <div className="text-sm font-medium text-red-800 dark:text-red-200">
                      {passwordError}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md"
                  >
                    변경
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setChangingPassword(false);
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                      setPasswordError("");
                    }}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md"
                  >
                    취소
                  </Button>
                </div>
              </div>
            </form>
          )}
          </div>
        </div>

        {/* Mobile Password Change */}
        <div className="md:hidden rounded-lg border bg-white/50 dark:bg-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">비밀번호 변경</h2>
            {!changingPassword && (
              <Button
                onClick={() => setChangingPassword(true)}
                className="px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded-md"
              >
                변경
              </Button>
            )}
          </div>

          {passwordSuccess && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3">
              <div className="text-sm font-medium text-green-800 dark:text-green-200">
                {passwordSuccess}
              </div>
            </div>
          )}

          {changingPassword && (
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  현재 비밀번호
                </label>
                <Input
                  name="currentPassword"
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="현재 비밀번호"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  새 비밀번호
                </label>
                <Input
                  name="newPassword"
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="새 비밀번호 (최소 8자)"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  새 비밀번호 확인
                </label>
                <Input
                  name="confirmPassword"
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="새 비밀번호 확인"
                  className="w-full"
                />
              </div>

              {passwordError && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
                  <div className="text-sm font-medium text-red-800 dark:text-red-200">
                    {passwordError}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button type="submit" className="w-full px-3 py-2 bg-yellow-500 text-white hover:bg-yellow-600 rounded text-sm">
                  변경
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChangingPassword(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setPasswordError("");
                  }}
                  className="w-full px-3 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded text-sm"
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
