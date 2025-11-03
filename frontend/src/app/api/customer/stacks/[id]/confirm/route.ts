import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/customer/stacks/[id]/confirm
 * 개별 수정 후 승인
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const customerId = (session.user as any).customerId;
    const { id: stackId } = params;

    // 권한 체크
    if (userRole !== "CUSTOMER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // Stack 확인
    const stack = await prisma.stack.findFirst({
      where: {
        id: stackId,
        customerId,
        status: "PENDING_REVIEW" as any,
      },
    });

    if (!stack) {
      return NextResponse.json(
        { error: "검토 대기 굴뚝을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { siteCode, siteName, location, height, diameter, coordinates } = body;

    // 변경 사항 추적
    const changes: any = {};
    if (siteCode && siteCode !== stack.siteCode) {
      changes.siteCode = { old: stack.siteCode, new: siteCode };
    }
    if (siteName && siteName !== stack.siteName) {
      changes.siteName = { old: stack.siteName, new: siteName };
    }
    if (location && location !== stack.location) {
      changes.location = { old: stack.location, new: location };
    }
    if (height && height !== stack.height) {
      changes.height = { old: stack.height, new: height };
    }
    if (diameter && diameter !== stack.diameter) {
      changes.diameter = { old: stack.diameter, new: diameter };
    }

    // Transaction으로 처리
    await prisma.$transaction(async (tx) => {
      // 1. Stack 수정 + 확정
      await tx.stack.update({
        where: { id: stackId },
        data: {
          siteCode: siteCode || stack.siteCode,
          siteName: siteName || stack.siteName,
          name: siteCode || stack.name,
          fullName: siteName || stack.fullName,
          location: location !== undefined ? location : stack.location,
          height: height !== undefined ? parseFloat(height) : stack.height,
          diameter: diameter !== undefined ? parseFloat(diameter) : stack.diameter,
          coordinates:
            coordinates !== undefined
              ? JSON.stringify(coordinates)
              : stack.coordinates,
          status: "CONFIRMED" as any,
          confirmedBy: userId,
          confirmedAt: new Date(),
        },
      });

      // 2. 변경 이력 생성
      if (Object.keys(changes).length > 0) {
        for (const [fieldName, change] of Object.entries(changes)) {
          await tx.stackHistory.create({
            data: {
              stackId,
              fieldName,
              previousValue: String(change.old || ""),
              newValue: String(change.new || ""),
              changedBy: userId,
            },
          });
        }
      }

      // 3. StackOrganization 생성
      if (stack.draftCreatedBy) {
        await tx.stackOrganization.create({
          data: {
            stackId,
            organizationId: stack.draftCreatedBy,
            status: "APPROVED",
            isPrimary: true,
            requestedBy: userId,
            approvedBy: userId,
            approvedAt: new Date(),
          },
        });
      }
    });

    return NextResponse.json({
      stackId,
      status: "CONFIRMED",
      changes,
      message: "굴뚝이 수정 및 확정되었습니다.",
    });
  } catch (error: any) {
    console.error("[PATCH /api/customer/stacks/[id]/confirm] Error:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
