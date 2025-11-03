import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyStackUpdatedByCustomer, notifyStackUpdatedByOrg } from "@/lib/notification-helper";

// 중요 필드 정의 (충돌 감지 대상)
const CRITICAL_FIELDS = ['height', 'diameter', 'location', 'coordinates'];

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const stack = await prisma.stack.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    if (!stack) {
      return NextResponse.json({ error: "굴뚝을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ data: stack });
  } catch (error) {
    console.error("Get stack error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const organizationId = (session.user as any).organizationId;

    // 권한 체크: 고객사 관리자 또는 환경측정기업 관리자/실무자
    if (userRole !== "CUSTOMER_ADMIN" && userRole !== "ORG_ADMIN" && userRole !== "OPERATOR") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 측정 데이터 확인
    const measurementCount = await prisma.measurement.count({
      where: { stackId: params.id }
    });

    if (measurementCount > 0) {
      return NextResponse.json(
        { error: "측정 데이터가 있는 굴뚝은 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    // 환경측정기업은 담당 고객사의 굴뚝만 삭제 가능
    if (userRole === "ORG_ADMIN" || userRole === "OPERATOR") {
      const stack = await prisma.stack.findUnique({
        where: { id: params.id },
        select: { customerId: true }
      });
      
      if (!stack) {
        return NextResponse.json({ error: "굴뚝을 찾을 수 없습니다." }, { status: 404 });
      }
      
      // 해당 고객사가 이 환경측정기업의 담당 고객사인지 확인
      const customerOrg = await prisma.customerOrganization.findFirst({
        where: {
          customerId: stack.customerId,
          organizationId: organizationId,
          status: "APPROVED"
        }
      });
      
      if (!customerOrg) {
        return NextResponse.json({ error: "담당 고객사가 아닙니다." }, { status: 403 });
      }
    }

    await prisma.stack.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "삭제되었습니다." });
  } catch (error) {
    console.error("Delete stack error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userName = (session.user as any).name || "Unknown";
    const userRole = (session.user as any).role;
    const userCustomerId = (session.user as any).customerId;

    // 기존 굴뚝 정보 조회
    const currentStack = await prisma.stack.findUnique({
      where: { id },
    });

    if (!currentStack) {
      return NextResponse.json(
        { error: "굴뚝을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 동시 수정 충돌 감지
    if (body._lastSeenAt) {
      const lastSeenAt = new Date(body._lastSeenAt);
      if (currentStack.updatedAt > lastSeenAt) {
        // 다른 사용자가 이미 수정함
        const criticalChanges = CRITICAL_FIELDS.filter(field => 
          body[field] !== undefined && 
          (currentStack as any)[field] !== body[field]
        );

        if (criticalChanges.length > 0) {
          // 중요 필드 충돌 → 사용자에게 확인 요청
          return NextResponse.json({
            error: "CONFLICT",
            message: "다른 사용자가 중요 정보를 수정했습니다.",
            conflicts: criticalChanges.map(field => ({
              field,
              currentValue: (currentStack as any)[field],
              yourValue: body[field]
            })),
            currentData: currentStack
          }, { status: 409 });
        }
        // 일반 필드만 변경 → Last Write Wins (계속 진행)
      }
    }

    // 권한 체크: 고객사 사용자는 자사 굴뚝만 수정 가능
    if (userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER") {
      if (currentStack.customerId !== userCustomerId) {
        return NextResponse.json(
          { error: "권한이 없습니다." },
          { status: 403 }
        );
      }
      // 고객사 사용자는 특정 필드만 수정 가능
      const allowedFields = ['code', 'location', 'height', 'diameter', 'coordinates', 'description', 'fullName', 'facilityType', 'category'];
      const restrictedFields = Object.keys(body).filter(key => 
        !allowedFields.includes(key) && key !== 'changeReason' && key !== 'isActive'
      );
      if (restrictedFields.length > 0) {
        return NextResponse.json(
          { error: `고객사는 다음 필드를 수정할 수 없습니다: ${restrictedFields.join(', ')}` },
          { status: 403 }
        );
      }
    }

    // 이름 중복 체크 (이름 변경 시, 같은 고객사 내)
    if (body.name && body.name !== currentStack.name) {
      const existing = await prisma.stack.findFirst({
        where: {
          name: body.name,
          customerId: currentStack.customerId,
          id: { not: id },
        },
      });
      
      if (existing) {
        return NextResponse.json(
          { error: "같은 고객사에 이미 존재하는 굴뚝명입니다" },
          { status: 400 }
        );
      }
    }

    // 이력 추적 대상 필드
    const trackedFields = ['name', 'code', 'location', 'height', 'diameter', 'coordinates', 'fullName', 'facilityType'];
    const historyRecords = [];

    // 변경된 필드 확인 및 이력 생성
    for (const field of trackedFields) {
      if (body[field] !== undefined && body[field] !== (currentStack as any)[field]) {
        historyRecords.push({
          stackId: id,
          fieldName: field,
          previousValue: (currentStack as any)[field]?.toString() || null,
          newValue: body[field]?.toString() || null,
          changeReason: body.changeReason || null,
          changedBy: userId,
        });
      }
    }

    // 트랜잭션으로 업데이트 및 이력 생성
    const result = await prisma.$transaction(async (tx) => {
      // 업데이트할 데이터 구성
      const updateData: any = {};
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      if (body.name !== undefined) updateData.name = body.name;
      if (body.code !== undefined) updateData.code = body.code;
      if (body.location !== undefined) updateData.location = body.location;
      if (body.height !== undefined) updateData.height = body.height;
      if (body.diameter !== undefined) updateData.diameter = body.diameter;
      if (body.coordinates !== undefined) updateData.coordinates = body.coordinates;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.fullName !== undefined) updateData.fullName = body.fullName;
      if (body.facilityType !== undefined) updateData.facilityType = body.facilityType;
      if (body.category !== undefined) updateData.category = body.category;

      // 굴뚝 업데이트
      const updated = await tx.stack.update({
        where: { id },
        data: updateData,
        include: {
          customer: {
            select: {
              name: true,
            },
          },
        },
      });

      // 이력 생성
      if (historyRecords.length > 0 && userId) {
        await tx.stackHistory.createMany({
          data: historyRecords,
        });
      }

      return updated;
    });

    // 알림 생성
    if (historyRecords.length > 0) {
      try {
        if (userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER") {
          // 고객사가 수정 → 환경측정기업에 알림
          await notifyStackUpdatedByCustomer({
            stackId: result.id,
            stackName: result.name,
            customerId: result.customerId,
            customerName: (result as any).customer.name,
            changedFields: historyRecords.map(h => h.fieldName),
            changeReason: body.changeReason,
          });
        } else if (userRole === "ORG_ADMIN" || userRole === "OPERATOR") {
          // 환경측정기업이 수정 → 고객사에 알림
          const org = await prisma.organization.findUnique({
            where: { id: (session.user as any).organizationId },
            select: { name: true }
          });
          
          if (org) {
            await notifyStackUpdatedByOrg({
              stackId: result.id,
              stackName: result.name,
              customerId: result.customerId,
              organizationName: org.name,
              changedFields: historyRecords.map(h => h.fieldName),
              changeReason: body.changeReason,
            });
          }
        }
      } catch (notifyError) {
        console.error("[PATCH /api/stacks/[id]] Notification error:", notifyError);
        // 알림 실패해도 수정은 성공
      }
    }
    
    return NextResponse.json({ 
      ok: true, 
      data: result,
      historyCreated: historyRecords.length 
    });
  } catch (err: any) {
    console.error("Stack update error:", err);
    return NextResponse.json(
      { error: err.message || "업데이트 실패" },
      { status: 500 }
    );
  }
}

