-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('DRAFT', 'CONNECTED');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'BASIC', 'PLUS', 'MASTER', 'STANDARD', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR', 'CUSTOMER_ADMIN', 'CUSTOMER_USER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "AccessScope" AS ENUM ('SYSTEM', 'ORGANIZATION', 'SITE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('STACK_CREATED_BY_CUSTOMER', 'STACK_UPDATED_BY_CUSTOMER', 'STACK_CREATED_BY_ORG', 'STACK_UPDATED_BY_ORG', 'STACK_VERIFIED_BY_CUSTOMER', 'STACK_INTERNAL_CODE_NEEDED', 'CUSTOMER_INFO_UPDATED_BY_ORG', 'CUSTOMER_INFO_UPDATED_BY_CUSTOMER', 'CONNECTION_REQUEST', 'CONTRACT_EXPIRY_30', 'CONTRACT_EXPIRY_21', 'CONTRACT_EXPIRY_14', 'CONTRACT_EXPIRY_7', 'CONTRACT_EXPIRY_DAILY', 'CONTRACT_EXPIRED', 'COMMUNICATION_MENTION', 'COMMUNICATION_URGENT', 'COMMUNICATION_CLIENT_REQUEST', 'COMMUNICATION_ASSIGNED', 'COMMUNICATION_STATUS_CHANGED');

-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('PHONE', 'EMAIL', 'VISIT', 'KAKAO', 'SMS', 'FAX', 'OTHER');

-- CreateEnum
CREATE TYPE "CommunicationDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REFERENCE');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('URGENT', 'HIGH', 'NORMAL', 'LOW');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "businessNumber" TEXT,
    "corporateNumber" TEXT,
    "fullName" TEXT,
    "representative" TEXT,
    "siteType" TEXT,
    "address" TEXT,
    "businessType" TEXT,
    "industry" TEXT,
    "siteCategory" TEXT,
    "contractStartDate" TIMESTAMP(3),
    "contractEndDate" TIMESTAMP(3),
    "groupId" TEXT,
    "createdBy" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "mergedIntoId" TEXT,
    "mergedAt" TIMESTAMP(3),
    "status" "CustomerStatus" NOT NULL DEFAULT 'CONNECTED',
    "draftCreatedBy" TEXT,
    "draftCreatedAt" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "lastModifiedBy" TEXT,
    "lastModifiedAt" TIMESTAMP(3),
    "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "hideSubscriptionInfo" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stack" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "siteCode" TEXT NOT NULL DEFAULT '',
    "siteName" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "code" TEXT,
    "fullName" TEXT,
    "facilityType" TEXT,
    "category" TEXT,
    "location" TEXT,
    "height" DOUBLE PRECISION,
    "diameter" DOUBLE PRECISION,
    "coordinates" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "status" TEXT,
    "draftCreatedBy" TEXT,
    "draftCreatedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "englishName" TEXT,
    "unit" TEXT,
    "limit" DOUBLE PRECISION,
    "category" TEXT,
    "classification" TEXT,
    "analysisMethod" TEXT,
    "hasLimit" BOOLEAN,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "inputType" TEXT DEFAULT 'number',
    "options" TEXT,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "stackId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "weather" TEXT,
    "temperatureC" DOUBLE PRECISION,
    "humidityPct" DOUBLE PRECISION,
    "pressureMmHg" DOUBLE PRECISION,
    "windDirection" TEXT,
    "windSpeedMs" DOUBLE PRECISION,
    "gasVelocityMs" DOUBLE PRECISION,
    "gasTempC" DOUBLE PRECISION,
    "moisturePct" DOUBLE PRECISION,
    "oxygenMeasuredPct" DOUBLE PRECISION,
    "oxygenStdPct" DOUBLE PRECISION,
    "flowSm3Min" DOUBLE PRECISION,
    "limitAtMeasure" DOUBLE PRECISION,
    "limitCheck" TEXT,
    "measuringCompany" TEXT,

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StackAlias" (
    "id" TEXT NOT NULL,
    "stackId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "type" TEXT,

    CONSTRAINT "StackAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemLimitHistory" (
    "id" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "limit" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "source" TEXT,

    CONSTRAINT "ItemLimitHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmissionLimit" (
    "id" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "limit" DOUBLE PRECISION NOT NULL,
    "region" TEXT,
    "customerId" TEXT NOT NULL DEFAULT '',
    "stackId" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmissionLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "customerId" TEXT NOT NULL,
    "stackId" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "companyName" TEXT NOT NULL,
    "address" TEXT,
    "representative" TEXT,
    "environmentalTech" TEXT,
    "industry" TEXT,
    "facilityType" TEXT,
    "siteCategory" TEXT,
    "purpose" TEXT,
    "stackName" TEXT NOT NULL,
    "stackHeight" DOUBLE PRECISION,
    "stackDiameter" DOUBLE PRECISION,
    "stackType" TEXT,
    "requestedItems" TEXT,
    "weather" TEXT,
    "temp" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "pressure" DOUBLE PRECISION,
    "windDir" TEXT,
    "wind" DOUBLE PRECISION,
    "o2Standard" DOUBLE PRECISION,
    "o2Measured" DOUBLE PRECISION,
    "flow" DOUBLE PRECISION,
    "flowCorrected" DOUBLE PRECISION,
    "moisture" DOUBLE PRECISION,
    "gasTemp" DOUBLE PRECISION,
    "gasVel" DOUBLE PRECISION,
    "gasNote" TEXT,
    "samplingDate" TIMESTAMP(3) NOT NULL,
    "samplingStart" TEXT,
    "samplingEnd" TEXT,
    "sampler" TEXT,
    "sampler2" TEXT,
    "measurements" TEXT NOT NULL,
    "analysisStart" TEXT,
    "analysisEnd" TEXT,
    "analyst" TEXT,
    "chiefTech" TEXT,
    "opinion" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "environmentalTech" TEXT,
    "chiefTech" TEXT,
    "analyst" TEXT,
    "sampler" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StagingMeasurementRaw" (
    "id" TEXT NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "rowNo" INTEGER NOT NULL,
    "rawJson" TEXT NOT NULL,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StagingMeasurementRaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessNumber" TEXT,
    "corporateNumber" TEXT,
    "businessType" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "representative" TEXT,
    "website" TEXT,
    "fax" TEXT,
    "establishedDate" TIMESTAMP(3),
    "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "subscriptionStartAt" TIMESTAMP(3),
    "subscriptionEndAt" TIMESTAMP(3),
    "maxUsers" INTEGER NOT NULL DEFAULT 1,
    "maxStacks" INTEGER NOT NULL DEFAULT 5,
    "maxDataRetention" INTEGER NOT NULL DEFAULT 365,
    "billingEmail" TEXT,
    "billingContact" TEXT,
    "lastPaymentAt" TIMESTAMP(3),
    "nextBillingAt" TIMESTAMP(3),
    "hasContractManagement" BOOLEAN NOT NULL DEFAULT false,
    "hideSubscriptionInfo" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionHistory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "amount" DOUBLE PRECISION,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "organizationId" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER_USER',
    "customerId" TEXT,
    "customerGroupId" TEXT,
    "customRoleId" TEXT,
    "accessScope" "AccessScope" NOT NULL DEFAULT 'SITE',
    "department" TEXT,
    "position" TEXT,
    "companyName" TEXT,
    "businessNumber" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "passwordResetRequired" BOOLEAN NOT NULL DEFAULT false,
    "inviteToken" TEXT,
    "inviteTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "targetId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerOrganization" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "contractStartDate" TIMESTAMP(3),
    "contractEndDate" TIMESTAMP(3),
    "customCode" TEXT,
    "nickname" TEXT,
    "proposedData" JSONB,
    "notified30Days" BOOLEAN NOT NULL DEFAULT false,
    "notified21Days" BOOLEAN NOT NULL DEFAULT false,
    "notified14Days" BOOLEAN NOT NULL DEFAULT false,
    "notified7Days" BOOLEAN NOT NULL DEFAULT false,
    "notifiedExpiry" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,

    CONSTRAINT "CustomerOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StackOrganization" (
    "id" TEXT NOT NULL,
    "stackId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,

    CONSTRAINT "StackOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StackRequest" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "stackName" TEXT,
    "stackCode" TEXT,
    "location" TEXT,
    "height" DOUBLE PRECISION,
    "diameter" DOUBLE PRECISION,
    "coordinates" TEXT,
    "description" TEXT,
    "existingStackId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    CONSTRAINT "StackRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StackCode" (
    "id" TEXT NOT NULL,
    "stackId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "internalCode" TEXT NOT NULL,
    "internalName" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "StackCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StackHistory" (
    "id" TEXT NOT NULL,
    "stackId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "changeReason" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StackHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StackUpdateLog" (
    "id" TEXT NOT NULL,
    "stackId" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changes" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "notifiedOrgs" TEXT NOT NULL,

    CONSTRAINT "StackUpdateLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessNumber" TEXT NOT NULL,
    "address" TEXT,
    "industry" TEXT,
    "representative" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleTemplatePermission" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "permissionCode" TEXT NOT NULL,

    CONSTRAINT "RoleTemplatePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomRole" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "customerId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomRolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionCode" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CustomRolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionCode" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StackAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stackId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "StackAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionChangeLog" (
    "id" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changerRole" TEXT NOT NULL,
    "changerName" TEXT NOT NULL,
    "targetUser" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT NOT NULL,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorMsg" TEXT,

    CONSTRAINT "PermissionChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerInvitation" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "adminEmail" TEXT,
    "adminName" TEXT,
    "adminPhone" TEXT,
    "suggestedRole" TEXT,
    "roleNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "CustomerInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stackId" TEXT,
    "customerId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StackMeasurementItem" (
    "id" TEXT NOT NULL,
    "stackId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StackMeasurementItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeasurementTemp" (
    "id" TEXT NOT NULL,
    "tempId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "stackId" TEXT NOT NULL,
    "measurementDate" TIMESTAMP(3) NOT NULL,
    "measurements" TEXT NOT NULL,
    "auxiliaryData" TEXT,
    "status" TEXT NOT NULL DEFAULT '???????,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeasurementTemp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastNotifiedAt" TIMESTAMP(3),
    "memo" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communications" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "measurementId" TEXT,
    "stackId" TEXT,
    "contactAt" TIMESTAMP(3) NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "direction" "CommunicationDirection" NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "contactPerson" TEXT,
    "contactOrg" TEXT,
    "isShared" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_attachments" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_replies" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "direction" "CommunicationDirection" NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_notes" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "organizationId" TEXT,
    "customerId" TEXT,
    "mentionedUserId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_templates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "channel" "CommunicationChannel",
    "category" TEXT,
    "organizationId" TEXT,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insight_reports" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "periods" INTEGER NOT NULL,
    "reportData" TEXT NOT NULL,
    "chartImage" TEXT,
    "pdfBase64" TEXT NOT NULL,
    "sharedAt" TIMESTAMP(3),
    "sharedBy" TEXT,
    "viewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "insight_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_code_idx" ON "Customer"("code");

-- CreateIndex
CREATE INDEX "Customer_businessNumber_idx" ON "Customer"("businessNumber");

-- CreateIndex
CREATE INDEX "Customer_groupId_idx" ON "Customer"("groupId");

-- CreateIndex
CREATE INDEX "Customer_createdBy_idx" ON "Customer"("createdBy");

-- CreateIndex
CREATE INDEX "Customer_status_idx" ON "Customer"("status");

-- CreateIndex
CREATE INDEX "Customer_draftCreatedBy_idx" ON "Customer"("draftCreatedBy");

-- CreateIndex
CREATE INDEX "Stack_customerId_idx" ON "Stack"("customerId");

-- CreateIndex
CREATE INDEX "Stack_isActive_idx" ON "Stack"("isActive");

-- CreateIndex
CREATE INDEX "Stack_isVerified_idx" ON "Stack"("isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "Stack_customerId_siteCode_key" ON "Stack"("customerId", "siteCode");

-- CreateIndex
CREATE UNIQUE INDEX "Stack_customerId_name_key" ON "Stack"("customerId", "name");

-- CreateIndex
CREATE INDEX "Measurement_customerId_stackId_itemKey_measuredAt_idx" ON "Measurement"("customerId", "stackId", "itemKey", "measuredAt");

-- CreateIndex
CREATE INDEX "Measurement_customerId_stackId_measuredAt_idx" ON "Measurement"("customerId", "stackId", "measuredAt");

-- CreateIndex
CREATE INDEX "Measurement_itemKey_measuredAt_idx" ON "Measurement"("itemKey", "measuredAt");

-- CreateIndex
CREATE INDEX "Measurement_organizationId_idx" ON "Measurement"("organizationId");

-- CreateIndex
CREATE INDEX "Measurement_customerId_organizationId_idx" ON "Measurement"("customerId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Measurement_stackId_itemKey_measuredAt_key" ON "Measurement"("stackId", "itemKey", "measuredAt");

-- CreateIndex
CREATE INDEX "StackAlias_alias_idx" ON "StackAlias"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "StackAlias_stackId_alias_key" ON "StackAlias"("stackId", "alias");

-- CreateIndex
CREATE INDEX "ItemLimitHistory_itemKey_idx" ON "ItemLimitHistory"("itemKey");

-- CreateIndex
CREATE INDEX "EmissionLimit_itemKey_idx" ON "EmissionLimit"("itemKey");

-- CreateIndex
CREATE INDEX "EmissionLimit_customerId_idx" ON "EmissionLimit"("customerId");

-- CreateIndex
CREATE INDEX "EmissionLimit_stackId_idx" ON "EmissionLimit"("stackId");

-- CreateIndex
CREATE UNIQUE INDEX "EmissionLimit_itemKey_customerId_stackId_key" ON "EmissionLimit"("itemKey", "customerId", "stackId");

-- CreateIndex
CREATE INDEX "Report_customerId_stackId_measuredAt_idx" ON "Report"("customerId", "stackId", "measuredAt");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_createdBy_idx" ON "Report"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "ReportTemplate_customerId_key" ON "ReportTemplate"("customerId");

-- CreateIndex
CREATE INDEX "StagingMeasurementRaw_sourceFile_rowNo_idx" ON "StagingMeasurementRaw"("sourceFile", "rowNo");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_businessNumber_key" ON "Organization"("businessNumber");

-- CreateIndex
CREATE INDEX "Organization_businessNumber_idx" ON "Organization"("businessNumber");

-- CreateIndex
CREATE INDEX "Organization_subscriptionStatus_idx" ON "Organization"("subscriptionStatus");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_organizationId_idx" ON "SubscriptionHistory"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_idx" ON "Invoice"("organizationId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "User_customerId_idx" ON "User"("customerId");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "CustomerAssignment_userId_idx" ON "CustomerAssignment"("userId");

-- CreateIndex
CREATE INDEX "CustomerAssignment_customerId_idx" ON "CustomerAssignment"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAssignment_userId_customerId_key" ON "CustomerAssignment"("userId", "customerId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "SystemSettings_category_idx" ON "SystemSettings"("category");

-- CreateIndex
CREATE INDEX "SystemSettings_key_idx" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "CustomerOrganization_customerId_organizationId_idx" ON "CustomerOrganization"("customerId", "organizationId");

-- CreateIndex
CREATE INDEX "CustomerOrganization_status_idx" ON "CustomerOrganization"("status");

-- CreateIndex
CREATE INDEX "CustomerOrganization_contractEndDate_idx" ON "CustomerOrganization"("contractEndDate");

-- CreateIndex
CREATE INDEX "StackOrganization_status_idx" ON "StackOrganization"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StackOrganization_stackId_organizationId_key" ON "StackOrganization"("stackId", "organizationId");

-- CreateIndex
CREATE INDEX "StackRequest_status_idx" ON "StackRequest"("status");

-- CreateIndex
CREATE INDEX "StackRequest_customerId_idx" ON "StackRequest"("customerId");

-- CreateIndex
CREATE INDEX "StackCode_organizationId_internalCode_idx" ON "StackCode"("organizationId", "internalCode");

-- CreateIndex
CREATE INDEX "StackCode_stackId_idx" ON "StackCode"("stackId");

-- CreateIndex
CREATE UNIQUE INDEX "StackCode_stackId_organizationId_key" ON "StackCode"("stackId", "organizationId");

-- CreateIndex
CREATE INDEX "StackHistory_stackId_idx" ON "StackHistory"("stackId");

-- CreateIndex
CREATE INDEX "StackHistory_changedAt_idx" ON "StackHistory"("changedAt");

-- CreateIndex
CREATE INDEX "StackUpdateLog_stackId_idx" ON "StackUpdateLog"("stackId");

-- CreateIndex
CREATE INDEX "StackUpdateLog_updatedAt_idx" ON "StackUpdateLog"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerGroup_businessNumber_key" ON "CustomerGroup"("businessNumber");

-- CreateIndex
CREATE INDEX "CustomerGroup_businessNumber_idx" ON "CustomerGroup"("businessNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RoleTemplate_code_key" ON "RoleTemplate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RoleTemplatePermission_templateId_permissionCode_key" ON "RoleTemplatePermission"("templateId", "permissionCode");

-- CreateIndex
CREATE INDEX "CustomRole_organizationId_idx" ON "CustomRole"("organizationId");

-- CreateIndex
CREATE INDEX "CustomRole_customerId_idx" ON "CustomRole"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomRole_organizationId_name_key" ON "CustomRole"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomRolePermission_roleId_permissionCode_key" ON "CustomRolePermission"("roleId", "permissionCode");

-- CreateIndex
CREATE INDEX "UserPermission_userId_idx" ON "UserPermission"("userId");

-- CreateIndex
CREATE INDEX "UserPermission_expiresAt_idx" ON "UserPermission"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permissionCode_key" ON "UserPermission"("userId", "permissionCode");

-- CreateIndex
CREATE INDEX "StackAssignment_userId_idx" ON "StackAssignment"("userId");

-- CreateIndex
CREATE INDEX "StackAssignment_stackId_idx" ON "StackAssignment"("stackId");

-- CreateIndex
CREATE UNIQUE INDEX "StackAssignment_userId_stackId_key" ON "StackAssignment"("userId", "stackId");

-- CreateIndex
CREATE INDEX "PermissionChangeLog_targetUser_idx" ON "PermissionChangeLog"("targetUser");

-- CreateIndex
CREATE INDEX "PermissionChangeLog_changedBy_idx" ON "PermissionChangeLog"("changedBy");

-- CreateIndex
CREATE INDEX "PermissionChangeLog_changedAt_idx" ON "PermissionChangeLog"("changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerInvitation_token_key" ON "CustomerInvitation"("token");

-- CreateIndex
CREATE INDEX "CustomerInvitation_token_idx" ON "CustomerInvitation"("token");

-- CreateIndex
CREATE INDEX "CustomerInvitation_status_idx" ON "CustomerInvitation"("status");

-- CreateIndex
CREATE INDEX "CustomerInvitation_customerId_idx" ON "CustomerInvitation"("customerId");

-- CreateIndex
CREATE INDEX "CustomerInvitation_organizationId_idx" ON "CustomerInvitation"("organizationId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "StackMeasurementItem_stackId_idx" ON "StackMeasurementItem"("stackId");

-- CreateIndex
CREATE INDEX "StackMeasurementItem_itemKey_idx" ON "StackMeasurementItem"("itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "StackMeasurementItem_stackId_itemKey_key" ON "StackMeasurementItem"("stackId", "itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "MeasurementTemp_tempId_key" ON "MeasurementTemp"("tempId");

-- CreateIndex
CREATE INDEX "MeasurementTemp_createdAt_idx" ON "MeasurementTemp"("createdAt");

-- CreateIndex
CREATE INDEX "MeasurementTemp_createdBy_idx" ON "MeasurementTemp"("createdBy");

-- CreateIndex
CREATE INDEX "MeasurementTemp_customerId_idx" ON "MeasurementTemp"("customerId");

-- CreateIndex
CREATE INDEX "MeasurementTemp_stackId_idx" ON "MeasurementTemp"("stackId");

-- CreateIndex
CREATE INDEX "Contract_organizationId_idx" ON "Contract"("organizationId");

-- CreateIndex
CREATE INDEX "Contract_customerId_idx" ON "Contract"("customerId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_endDate_idx" ON "Contract"("endDate");

-- CreateIndex
CREATE INDEX "communications_customerId_status_contactAt_idx" ON "communications"("customerId", "status", "contactAt" DESC);

-- CreateIndex
CREATE INDEX "communications_assignedToId_status_isDeleted_idx" ON "communications"("assignedToId", "status", "isDeleted");

-- CreateIndex
CREATE INDEX "communications_createdById_isDeleted_idx" ON "communications"("createdById", "isDeleted");

-- CreateIndex
CREATE INDEX "communications_isDeleted_contactAt_idx" ON "communications"("isDeleted", "contactAt" DESC);

-- CreateIndex
CREATE INDEX "communication_attachments_communicationId_idx" ON "communication_attachments"("communicationId");

-- CreateIndex
CREATE INDEX "communication_replies_communicationId_createdAt_idx" ON "communication_replies"("communicationId", "createdAt");

-- CreateIndex
CREATE INDEX "communication_notes_communicationId_idx" ON "communication_notes"("communicationId");

-- CreateIndex
CREATE INDEX "communication_notes_organizationId_idx" ON "communication_notes"("organizationId");

-- CreateIndex
CREATE INDEX "communication_notes_customerId_idx" ON "communication_notes"("customerId");

-- CreateIndex
CREATE INDEX "communication_notes_mentionedUserId_idx" ON "communication_notes"("mentionedUserId");

-- CreateIndex
CREATE INDEX "communication_templates_organizationId_isShared_category_idx" ON "communication_templates"("organizationId", "isShared", "category");

-- CreateIndex
CREATE INDEX "communication_templates_usageCount_idx" ON "communication_templates"("usageCount" DESC);

-- CreateIndex
CREATE INDEX "insight_reports_customerId_itemKey_createdAt_idx" ON "insight_reports"("customerId", "itemKey", "createdAt");

-- CreateIndex
CREATE INDEX "insight_reports_customerId_sharedAt_idx" ON "insight_reports"("customerId", "sharedAt");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CustomerGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stack" ADD CONSTRAINT "Stack_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_itemKey_fkey" FOREIGN KEY ("itemKey") REFERENCES "Item"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StackAlias" ADD CONSTRAINT "StackAlias_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemLimitHistory" ADD CONSTRAINT "ItemLimitHistory_itemKey_fkey" FOREIGN KEY ("itemKey") REFERENCES "Item"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTemplate" ADD CONSTRAINT "ReportTemplate_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_customerGroupId_fkey" FOREIGN KEY ("customerGroupId") REFERENCES "CustomerGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "CustomRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAssignment" ADD CONSTRAINT "CustomerAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAssignment" ADD CONSTRAINT "CustomerAssignment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerOrganization" ADD CONSTRAINT "CustomerOrganization_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerOrganization" ADD CONSTRAINT "CustomerOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StackOrganization" ADD CONSTRAINT "StackOrganization_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StackOrganization" ADD CONSTRAINT "StackOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StackRequest" ADD CONSTRAINT "StackRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StackRequest" ADD CONSTRAINT "StackRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StackRequest" ADD CONSTRAINT "StackRequest_existingStackId_fkey" FOREIGN KEY ("existingStackId") REFERENCES "Stack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StackCode" ADD CONSTRAINT "StackCode_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StackCode" ADD CONSTRAINT "StackCode_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StackHistory" ADD CONSTRAINT "StackHistory_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StackHistory" ADD CONSTRAINT "StackHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StackUpdateLog" ADD CONSTRAINT "StackUpdateLog_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleTemplatePermission" ADD CONSTRAINT "RoleTemplatePermission_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RoleTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomRole" ADD CONSTRAINT "CustomRole_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RoleTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomRole" ADD CONSTRAINT "CustomRole_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomRole" ADD CONSTRAINT "CustomRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomRolePermission" ADD CONSTRAINT "CustomRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "CustomRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StackAssignment" ADD CONSTRAINT "StackAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StackAssignment" ADD CONSTRAINT "StackAssignment_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerInvitation" ADD CONSTRAINT "CustomerInvitation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerInvitation" ADD CONSTRAINT "CustomerInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StackMeasurementItem" ADD CONSTRAINT "StackMeasurementItem_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StackMeasurementItem" ADD CONSTRAINT "StackMeasurementItem_itemKey_fkey" FOREIGN KEY ("itemKey") REFERENCES "Item"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementTemp" ADD CONSTRAINT "MeasurementTemp_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementTemp" ADD CONSTRAINT "MeasurementTemp_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "Measurement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_attachments" ADD CONSTRAINT "communication_attachments_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "communications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_attachments" ADD CONSTRAINT "communication_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_replies" ADD CONSTRAINT "communication_replies_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "communications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_replies" ADD CONSTRAINT "communication_replies_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_notes" ADD CONSTRAINT "communication_notes_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "communications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_notes" ADD CONSTRAINT "communication_notes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_notes" ADD CONSTRAINT "communication_notes_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_notes" ADD CONSTRAINT "communication_notes_mentionedUserId_fkey" FOREIGN KEY ("mentionedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_notes" ADD CONSTRAINT "communication_notes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_templates" ADD CONSTRAINT "communication_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_templates" ADD CONSTRAINT "communication_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_reports" ADD CONSTRAINT "insight_reports_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_reports" ADD CONSTRAINT "insight_reports_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_reports" ADD CONSTRAINT "insight_reports_sharedBy_fkey" FOREIGN KEY ("sharedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

