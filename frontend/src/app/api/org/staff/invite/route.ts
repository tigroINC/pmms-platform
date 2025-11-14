import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// POST /api/org/staff/invite - 직원 초대
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = session.user as any;
    const userRole = user.role;

    // ORG_ADMIN만 접근 가능
    if (userRole !== "ORG_ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, role } = body;

    // 유효성 검사
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "이름, 이메일, 역할은 필수입니다." },
        { status: 400 }
      );
    }

    // 역할 검증
    if (!["ORG_ADMIN", "OPERATOR"].includes(role)) {
      return NextResponse.json(
        { error: "유효하지 않은 역할입니다." },
        { status: 400 }
      );
    }

    // 조직 ID 및 조직명 가져오기
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        organizationId: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!currentUser?.organizationId && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "조직 정보가 없습니다." }, { status: 400 });
    }

    const organizationName = currentUser?.organization?.name || "PMMS 환경측정관리시스템";

    // 이메일 중복 체크
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "이미 등록된 이메일입니다." },
        { status: 400 }
      );
    }

    // 초대 토큰 생성 (24시간 유효)
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간

    // 사용자 생성 (비밀번호는 초대 수락 시 설정)
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: "", // 초대 수락 시 설정
        role,
        organizationId: currentUser?.organizationId,
        status: "PENDING", // 초대 수락 대기
        isActive: false, // 비밀번호 설정 후 활성화
        inviteToken,
        inviteTokenExpiry,
      },
    });

    // 활동 로그 기록
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "INVITE_STAFF",
        details: `${name} (${email})을 ${role} 역할로 초대`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    // 초대 링크 생성
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    const inviteUrl = `${baseUrl}/auth/accept-invite?token=${inviteToken}`;

    return NextResponse.json({
      message: "초대 링크가 생성되었습니다.",
      staff: newUser,
      inviteUrl,
    });
  } catch (error: any) {
    console.error("Invite staff error:", error);
    return NextResponse.json(
      { error: "직원 초대 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
