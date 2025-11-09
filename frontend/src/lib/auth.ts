import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("이메일과 비밀번호를 입력해주세요.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            organization: true,
            customer: true,
          }
        });

        if (!user) {
          throw new Error("등록되지 않은 이메일입니다.");
        }

        if (user.status !== "APPROVED") {
          throw new Error("승인 대기 중이거나 거부된 계정입니다.");
        }

        if (!user.isActive) {
          throw new Error("비활성화된 계정입니다.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("비밀번호가 일치하지 않습니다.");
        }

        // 로그인 정보 업데이트
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            loginCount: { increment: 1 },
          }
        });

        // 활동 로그 기록
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            ipAddress: null, // 미들웨어에서 추가 가능
            userAgent: null,
          }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          customerId: user.customerId,
          customerName: user.customer?.name || null,
          status: user.status,
          passwordResetRequired: user.passwordResetRequired,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
        token.customerId = (user as any).customerId;
        token.customerName = (user as any).customerName;
        token.status = (user as any).status;
        token.passwordResetRequired = (user as any).passwordResetRequired;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).organizationId = token.organizationId as string | null;
        (session.user as any).customerId = token.customerId as string | null;
        (session.user as any).customerName = token.customerName as string | null;
        (session.user as any).status = token.status as string;
        (session.user as any).passwordResetRequired = token.passwordResetRequired as boolean;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24시간
  },
  secret: process.env.NEXTAUTH_SECRET,
};
