import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canCreateCommunication,
  buildCommunicationWhereClause,
} from "@/lib/permissions/communication";

/**
 * POST /api/communications
 * 커뮤니케이션 등록
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const user = session.user as any;
    const body = await request.json();

    // 권한 체크 + 데이터 강제 적용
    const permission = await canCreateCommunication(user, body);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.error },
        { status: 403 }
      );
    }

    const data = permission.data || body;

    // 트랜잭션으로 처리
    const communication = await prisma.$transaction(async (tx) => {
      // 1. Communication 생성
      // 상태 설정 (내부전용도 PENDING으로 시작)
      const finalStatus = data.status || "PENDING";
      
      const comm = await tx.communication.create({
        data: {
          customerId: data.customerId,
          measurementId: data.measurementId || null,
          stackId: data.stackId || null,
          contactAt: new Date(data.contactAt),
          channel: data.channel,
          direction: data.direction,
          subject: data.subject || null,
          content: data.content,
          status: finalStatus,
          priority: data.priority || "NORMAL",
          createdById: user.id,
          assignedToId: data.assignedToId || null,
          contactOrg: data.contactOrg || null,
          contactPerson: data.contactPerson || null,
          isShared: data.isShared !== undefined ? data.isShared : true,
        },
        include: {
          customer: true,
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          assignedTo: {
            select: { id: true, name: true, email: true }
          },
        },
      });

      // 2. 알림 생성
      await createCommunicationNotifications(tx, comm, user);

      return comm;
    });

    return NextResponse.json(communication, { status: 201 });
  } catch (error: any) {
    console.error("Communication creation error:", error);
    return NextResponse.json(
      { error: "커뮤니케이션 등록 실패", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/communications
 * 커뮤니케이션 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const user = session.user as any;
    const { searchParams } = new URL(request.url);

    // 특수 뷰
    const view = searchParams.get("view");
    
    if (view === "my-tasks") {
      // 내 할일: 나에게 배정된 답변대기 건
      const communications = await prisma.communication.findMany({
        where: {
          assignedToId: user.id,
          status: "PENDING",
          isDeleted: false,
        },
        include: {
          customer: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          _count: {
            select: { notes: true, attachments: true }
          }
        },
        orderBy: [
          { priority: "asc" }, // URGENT 먼저
          { contactAt: "desc" }
        ],
        take: 100,
      });

      return NextResponse.json({
        tasks: communications,
        summary: {
          total: communications.length,
          urgent: communications.filter(c => c.priority === "URGENT").length,
          high: communications.filter(c => c.priority === "HIGH").length,
          normal: communications.filter(c => c.priority === "NORMAL").length,
        }
      });
    }

    if (view === "client-requests") {
      // 고객사가 직접 등록한 요청사항
      const communications = await prisma.communication.findMany({
        where: {
          createdBy: {
            role: { in: ["CUSTOMER_ADMIN", "CUSTOMER_USER"] }
          },
          status: "PENDING",
          isDeleted: false,
        },
        include: {
          customer: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, role: true } },
          assignedTo: { select: { id: true, name: true } },
          _count: {
            select: { notes: true, attachments: true }
          }
        },
        orderBy: { contactAt: "desc" },
        take: 100,
      });

      return NextResponse.json({ communications });
    }

    // 기본: 필터링된 목록 조회
    const whereClause = await buildCommunicationWhereClause(user);

    // 추가 필터
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");
    const channel = searchParams.get("channel");
    const priority = searchParams.get("priority");
    const assignedToId = searchParams.get("assignedToId");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (customerId) {
      (whereClause as any).customerId = customerId;
    }
    if (status) {
      (whereClause as any).status = status;
    }
    if (channel) {
      (whereClause as any).channel = channel;
    }
    if (priority) {
      (whereClause as any).priority = priority;
    }
    if (assignedToId) {
      (whereClause as any).assignedToId = assignedToId;
    }
    if (search) {
      (whereClause as any).OR = [
        { subject: { contains: search } },
        { content: { contains: search } },
      ];
    }
    if (startDate || endDate) {
      (whereClause as any).contactAt = {};
      if (startDate) {
        (whereClause as any).contactAt.gte = new Date(startDate);
      }
      if (endDate) {
        (whereClause as any).contactAt.lte = new Date(endDate);
      }
    }

    // 페이지네이션
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const skip = (page - 1) * limit;

    const [communications, total] = await Promise.all([
      prisma.communication.findMany({
        where: whereClause,
        select: {
          id: true,
          customerId: true,
          contactAt: true,
          channel: true,
          subject: true,
          content: true,
          status: true,
          priority: true,
          contactOrg: true,
          contactPerson: true,
          isShared: true,
          customer: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, role: true } },
          assignedTo: { select: { id: true, name: true } },
          _count: {
            select: { notes: true, attachments: true }
          }
        },
        orderBy: { contactAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.communication.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      data: communications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Communication list error:", error);
    return NextResponse.json(
      { error: "목록 조회 실패", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * 알림 생성 헬퍼 함수
 */
async function createCommunicationNotifications(
  tx: any,
  communication: any,
  createdBy: any
) {
  const notifications: any[] = [];
  const isInternalOnly = communication.isShared === false;
  
  // 내부전용은 알림 생성 안 함 (기록용)
  if (isInternalOnly) {
    return;
  }

  // 1. 담당자 배정됨
  if (communication.assignedToId && communication.assignedToId !== createdBy.id) {
    notifications.push({
      userId: communication.assignedToId,
      type: "COMMUNICATION_ASSIGNED",
      title: "새로운 커뮤니케이션이 배정되었습니다",
      message: `${communication.customer.name}의 커뮤니케이션이 배정되었습니다`,
      customerId: communication.customerId,
      metadata: JSON.stringify({ communicationId: communication.id }),
    });
  }

  // 2. 긴급 + 답변대기
  if (communication.priority === "URGENT" && communication.status === "PENDING") {
    const targetUserId = communication.assignedToId || await getCustomerManagerId(tx, communication.customerId);
    
    if (targetUserId) {
      notifications.push({
        userId: targetUserId,
        type: "COMMUNICATION_URGENT",
        title: "긴급 답변이 필요합니다",
        message: `${communication.customer.name}에서 긴급 답변을 요청했습니다`,
        customerId: communication.customerId,
        metadata: JSON.stringify({ communicationId: communication.id }),
      });
    }
  }

  // 3. 고객사가 등록한 경우 → 환경측정기업에 알림
  if (createdBy.role === "CUSTOMER_ADMIN" || createdBy.role === "CUSTOMER_USER") {
    const managers = await getCustomerManagers(tx, communication.customerId);
    
    managers.forEach(manager => {
      notifications.push({
        userId: manager.id,
        type: "COMMUNICATION_CLIENT_REQUEST",
        title: "고객사에서 요청사항을 등록했습니다",
        message: `${communication.customer.name} - ${communication.subject || communication.content.substring(0, 50)}`,
        customerId: communication.customerId,
        metadata: JSON.stringify({ communicationId: communication.id }),
      });
    });
  }
  
  // 4. 환경측정기업이 고객사 공유로 등록한 경우 → 고객사에 알림
  if ((createdBy.role === "ORG_ADMIN" || createdBy.role === "OPERATOR") && communication.isShared === true) {
    const customerUsers = await tx.user.findMany({
      where: {
        customerId: communication.customerId,
        role: { in: ["CUSTOMER_ADMIN", "CUSTOMER_USER"] }
      },
      select: { id: true }
    });
    
    if (customerUsers.length > 0) {
      customerUsers.forEach(customerUser => {
        notifications.push({
          userId: customerUser.id,
          type: "COMMUNICATION_STATUS_CHANGED",
          title: "새로운 소통 내역이 등록되었습니다",
          message: `${communication.subject || communication.content.substring(0, 50)}`,
          customerId: communication.customerId,
          metadata: JSON.stringify({ communicationId: communication.id }),
        });
      });
    }
  }

  // 일괄 생성
  if (notifications.length > 0) {
    await tx.notification.createMany({
      data: notifications,
    });
  }
}

/**
 * 고객사 담당 매니저 ID 조회
 */
async function getCustomerManagerId(tx: any, customerId: string): Promise<string | null> {
  const assignment = await tx.customerAssignment.findFirst({
    where: { customerId },
    include: { user: true },
  });
  
  return assignment?.userId || null;
}

/**
 * 고객사 담당 매니저 목록 조회
 */
async function getCustomerManagers(tx: any, customerId: string) {
  const assignments = await tx.customerAssignment.findMany({
    where: { customerId },
    include: { user: { select: { id: true, name: true } } },
  });
  
  return assignments.map(a => a.user);
}
