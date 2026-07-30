-- ============================================================
-- VMS PLTT Bintulu - Supabase Database Setup Script
-- ============================================================
-- Run this entire script in Supabase SQL Editor (Dashboard → SQL Editor → New Query → paste → Run)
-- This creates all tables and inserts all seed data.
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING).
-- ============================================================

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "departmentId" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "icPassportNo" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "company" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "hostStaffId" TEXT NOT NULL,
    "registeredById" TEXT,
    "expectedVisitDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_approval',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "checkedInAt" TIMESTAMP(3),
    "staffVerifiedAt" TIMESTAMP(3),
    "staffRemarks" TEXT,
    "feedbackSubmittedAt" TIMESTAMP(3),
    "exitConfirmedById" TEXT,
    "exitNotes" TEXT,
    "checkedOutAt" TIMESTAMP(3),
    "pdpaConsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorDocument" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comments" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "visitId" TEXT,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT,
    "recipientType" TEXT NOT NULL,
    "visitId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blacklist" (
    "id" TEXT NOT NULL,
    "icPassportNo" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- CreateIndex
CREATE INDEX "Profile_role_idx" ON "Profile"("role");

-- CreateIndex
CREATE INDEX "Profile_departmentId_idx" ON "Profile"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE INDEX "Visitor_icPassportNo_idx" ON "Visitor"("icPassportNo");

-- CreateIndex
CREATE INDEX "Visitor_phone_idx" ON "Visitor"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Visit_referenceCode_key" ON "Visit"("referenceCode");

-- CreateIndex
CREATE INDEX "Visit_status_idx" ON "Visit"("status");

-- CreateIndex
CREATE INDEX "Visit_hostStaffId_idx" ON "Visit"("hostStaffId");

-- CreateIndex
CREATE INDEX "Visit_visitorId_idx" ON "Visit"("visitorId");

-- CreateIndex
CREATE INDEX "Visit_referenceCode_idx" ON "Visit"("referenceCode");

-- CreateIndex
CREATE INDEX "VisitorDocument_visitorId_idx" ON "VisitorDocument"("visitorId");

-- CreateIndex
CREATE INDEX "VisitorDocument_visitId_idx" ON "VisitorDocument"("visitId");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_visitId_key" ON "Feedback"("visitId");

-- CreateIndex
CREATE INDEX "AuditLog_visitId_idx" ON "AuditLog"("visitId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_recipientId_idx" ON "Notification"("recipientId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "Blacklist_icPassportNo_key" ON "Blacklist"("icPassportNo");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_hostStaffId_fkey" FOREIGN KEY ("hostStaffId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_exitConfirmedById_fkey" FOREIGN KEY ("exitConfirmedById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorDocument" ADD CONSTRAINT "VisitorDocument_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorDocument" ADD CONSTRAINT "VisitorDocument_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blacklist" ADD CONSTRAINT "Blacklist_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DEPARTMENTS
INSERT INTO "Department" ("id", "name", "description", "createdAt") VALUES ('dept-pentadbiran', 'Pentadbiran', 'Bahagian Pentadbiran', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Department" ("id", "name", "description", "createdAt") VALUES ('dept-kewangan', 'Kewangan', 'Bahagian Kewangan', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Department" ("id", "name", "description", "createdAt") VALUES ('dept-latihan', 'Bahagian Latihan Teknikal', 'Latihan Teknikal', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Department" ("id", "name", "description", "createdAt") VALUES ('dept-hr', 'Sumber Manusia', 'Unit Sumber Manusia', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Department" ("id", "name", "description", "createdAt") VALUES ('dept-ict', 'Unit ICT', 'Unit Teknologi Maklumat', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Department" ("id", "name", "description", "createdAt") VALUES ('dept-keselamatan', 'Unit Keselamatan', 'Pengawal Keselamatan', NOW()) ON CONFLICT ("id") DO NOTHING;

-- PROFILES (users)
INSERT INTO "Profile" ("id", "email", "passwordHash", "fullName", "role", "departmentId", "phone", "isActive", "createdAt", "updatedAt") VALUES ('user-admin-rohana', 'rohana@pltbintulu.gov.my', '$2b$10$mSE46ahVD4jen.Hg/5juketBz2dFmSlnKUK17nWZ3bDlAFkn7xNW2', 'Puan Rohana Abdullah', 'admin', 'dept-pentadbiran', '+60198234001', true, NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Profile" ("id", "email", "passwordHash", "fullName", "role", "departmentId", "phone", "isActive", "createdAt", "updatedAt") VALUES ('user-sec-siti', 'siti@pltbintulu.gov.my', '$2b$10$mSE46ahVD4jen.Hg/5juketBz2dFmSlnKUK17nWZ3bDlAFkn7xNW2', 'Cik Siti Aishah', 'security', 'dept-keselamatan', '+60198234002', true, NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Profile" ("id", "email", "passwordHash", "fullName", "role", "departmentId", "phone", "isActive", "createdAt", "updatedAt") VALUES ('user-sec-amin', 'amin@pltbintulu.gov.my', '$2b$10$mSE46ahVD4jen.Hg/5juketBz2dFmSlnKUK17nWZ3bDlAFkn7xNW2', 'Encik Amin Rahman', 'security', 'dept-keselamatan', '+60198234003', true, NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Profile" ("id", "email", "passwordHash", "fullName", "role", "departmentId", "phone", "isActive", "createdAt", "updatedAt") VALUES ('user-sec-kumar', 'kumar@pltbintulu.gov.my', '$2b$10$mSE46ahVD4jen.Hg/5juketBz2dFmSlnKUK17nWZ3bDlAFkn7xNW2', 'Encik Kumar Shan', 'security', 'dept-keselamatan', '+60198234004', true, NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Profile" ("id", "email", "passwordHash", "fullName", "role", "departmentId", "phone", "isActive", "createdAt", "updatedAt") VALUES ('user-staff-faizal', 'faizal@pltbintulu.gov.my', '$2b$10$mSE46ahVD4jen.Hg/5juketBz2dFmSlnKUK17nWZ3bDlAFkn7xNW2', 'En. Faizal Ibrahim', 'staff', 'dept-pentadbiran', '+60198234010', true, NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Profile" ("id", "email", "passwordHash", "fullName", "role", "departmentId", "phone", "isActive", "createdAt", "updatedAt") VALUES ('user-staff-liza', 'liza@pltbintulu.gov.my', '$2b$10$mSE46ahVD4jen.Hg/5juketBz2dFmSlnKUK17nWZ3bDlAFkn7xNW2', 'Puan Liza Hashim', 'staff', 'dept-kewangan', '+60198234011', true, NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Profile" ("id", "email", "passwordHash", "fullName", "role", "departmentId", "phone", "isActive", "createdAt", "updatedAt") VALUES ('user-staff-hassan', 'hassan@pltbintulu.gov.my', '$2b$10$mSE46ahVD4jen.Hg/5juketBz2dFmSlnKUK17nWZ3bDlAFkn7xNW2', 'En. Hassan Ali', 'staff', 'dept-latihan', '+60198234012', true, NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Profile" ("id", "email", "passwordHash", "fullName", "role", "departmentId", "phone", "isActive", "createdAt", "updatedAt") VALUES ('user-staff-mei', 'mei@pltbintulu.gov.my', '$2b$10$mSE46ahVD4jen.Hg/5juketBz2dFmSlnKUK17nWZ3bDlAFkn7xNW2', 'Cik Mei Ling', 'staff', 'dept-hr', '+60198234013', true, NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Profile" ("id", "email", "passwordHash", "fullName", "role", "departmentId", "phone", "isActive", "createdAt", "updatedAt") VALUES ('user-staff-raj', 'raj@pltbintulu.gov.my', '$2b$10$mSE46ahVD4jen.Hg/5juketBz2dFmSlnKUK17nWZ3bDlAFkn7xNW2', 'En. Raj Kumar', 'staff', 'dept-ict', '+60198234014', true, NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;

-- VISITORS
INSERT INTO "Visitor" ("id", "fullName", "icPassportNo", "phone", "email", "company", "createdAt", "updatedAt") VALUES ('vis-001', 'Encik Anwar bin Rahman', '800101-13-5678', '+60123450001', 'anwar@syktabadi.com', 'Syarikat Abadi Sdn Bhd', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visitor" ("id", "fullName", "icPassportNo", "phone", "email", "company", "createdAt", "updatedAt") VALUES ('vis-002', 'Encik Tan Wei Ming', '850505-14-1234', '+60123450002', 'tan@precisiontech.my', 'Precision Tech Sdn Bhd', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visitor" ("id", "fullName", "icPassportNo", "phone", "email", "company", "createdAt", "updatedAt") VALUES ('vis-003', 'Puan Salmiah binti Yusof', '780909-08-9012', '+60123450003', 'salmiah@nusa.com', 'Nusa Consulting', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visitor" ("id", "fullName", "icPassportNo", "phone", "email", "company", "createdAt", "updatedAt") VALUES ('vis-004', 'Encik David Ling', '900202-14-3456', '+60123450004', 'david@lingcorp.com', 'Ling Corporation', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visitor" ("id", "fullName", "icPassportNo", "phone", "email", "company", "createdAt", "updatedAt") VALUES ('vis-005', 'Cik Nurul Aina', '950707-10-6789', '+60123450005', 'nurul@utmbintulu.edu', 'UTM Bintulu (Pelajar Latihan)', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visitor" ("id", "fullName", "icPassportNo", "phone", "email", "company", "createdAt", "updatedAt") VALUES ('vis-006', 'Encik Wong Chee Keong', '820303-08-2345', '+60123450006', 'wong@electricalworks.my', 'Electrical Works Sdn Bhd', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visitor" ("id", "fullName", "icPassportNo", "phone", "email", "company", "createdAt", "updatedAt") VALUES ('vis-007', 'Puan Faridah binti Omar', '760101-04-5678', '+60123450007', 'faridah@jkr.gov.my', 'JKR Sarawak', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visitor" ("id", "fullName", "icPassportNo", "phone", "email", "company", "createdAt", "updatedAt") VALUES ('vis-008', 'Encik Rajesh a/l Murugan', '880808-14-9012', '+60123450008', 'rajesh@itnet.my', 'IT Networks Sdn Bhd', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visitor" ("id", "fullName", "icPassportNo", "phone", "email", "company", "createdAt", "updatedAt") VALUES ('vis-009', 'Cik Amelia Tan', '920202-10-3456', '+60123450009', 'amelia@tan.com', 'Tan Holdings', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visitor" ("id", "fullName", "icPassportNo", "phone", "email", "company", "createdAt", "updatedAt") VALUES ('vis-010', 'Encik Mohd Hafiz', '870505-13-6789', '+60123450010', 'hafiz@contractor.my', 'Hafiz Contractor', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visitor" ("id", "fullName", "icPassportNo", "phone", "email", "company", "createdAt", "updatedAt") VALUES ('vis-011', 'Puan Lee Mei Ling', '840909-14-2345', '+60123450011', 'leemei@accounting.my', 'Lee Accounting Firm', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visitor" ("id", "fullName", "icPassportNo", "phone", "email", "company", "createdAt", "updatedAt") VALUES ('vis-012', 'Encik Alex Chong', '900101-08-5678', '+60123450012', 'alex@chongtech.com', 'Chong Technologies', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visitor" ("id", "fullName", "icPassportNo", "phone", "email", "company", "createdAt", "updatedAt") VALUES ('vis-013', 'Cik Siti Khadijah', '960606-10-9012', '+60123450013', 'khadijah@unisza.edu', 'Pelajar Praktikal', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visitor" ("id", "fullName", "icPassportNo", "phone", "email", "company", "createdAt", "updatedAt") VALUES ('vis-014', 'Encik Ibrahim bin Bakar', '750303-04-3456', '+60123450014', 'ibrahim@bakarent.my', 'Bakar Enterprise', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visitor" ("id", "fullName", "icPassportNo", "phone", "email", "company", "createdAt", "updatedAt") VALUES ('vis-015', 'Puan Normala', '800808-08-6789', '+60123450015', 'normala@supplier.my', 'Normala Suppliers', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visitor" ("id", "fullName", "icPassportNo", "phone", "email", "company", "createdAt", "updatedAt") VALUES ('vis-016', 'Encik David Chen', 'A12345678', '+60123450016', 'david.chen@global.com', 'Global Pte Ltd (Singapore)', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visitor" ("id", "fullName", "icPassportNo", "phone", "email", "company", "createdAt", "updatedAt") VALUES ('vis-017', 'Cik Zara Mohd', '950101-10-2345', '+60123450017', 'zara@startup.my', 'Startup Hub', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visitor" ("id", "fullName", "icPassportNo", "phone", "email", "company", "createdAt", "updatedAt") VALUES ('vis-018', 'Encik Hafizuddin', '871212-13-5678', '+60123450018', 'hafizuddin@vendor.my', 'Vendor Solutions', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;

-- VISITS
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status",           "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-001', 'VMS-20260714-0001', 'vis-001', 'Mesyuarat kontrak penyelenggaraan', 'user-staff-faizal',  '2026-07-15T03:43:04.456Z', 'pending_approval',           true, '2026-07-15T01:13:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status",           "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-002', 'VMS-20260714-0002', 'vis-006', 'Pembaikan sistem elektrik', 'user-staff-hassan',  '2026-07-15T04:43:04.456Z', 'pending_approval',           true, '2026-07-15T00:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status",           "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-003', 'VMS-20260714-0003', 'vis-017', 'Perbincangan kerjasama latihan industri', 'user-staff-mei',  '2026-07-16T01:43:04.456Z', 'pending_approval',           true, '2026-07-15T01:31:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",         "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-004', 'VMS-20260714-0004', 'vis-002', 'Demo perisian e-pembelajaran', 'user-staff-raj',  '2026-07-15T02:43:04.456Z', 'approved', 'user-sec-siti', '2026-07-14T23:43:04.456Z',         true, '2026-07-14T22:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",         "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-005', 'VMS-20260714-0005', 'vis-009', 'Mesyuarat Lembaga Pengarah', 'user-staff-faizal',  '2026-07-15T05:43:04.456Z', 'approved', 'user-sec-siti', '2026-07-15T00:43:04.456Z',         true, '2026-07-14T23:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt",       "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-006', 'VMS-20260714-0006', 'vis-003', 'Rundingan kewangan latihan', 'user-staff-liza',  '2026-07-15T00:43:04.456Z', 'checked_in', 'user-sec-amin', '2026-07-14T23:43:04.456Z',  '2026-07-15T00:55:04.456Z',       true, '2026-07-14T22:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt",       "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-007', 'VMS-20260714-0007', 'vis-011', 'Semakan audit kewangan', 'user-staff-liza',  '2026-07-15T01:13:04.456Z', 'checked_in', 'user-sec-siti', '2026-07-15T00:43:04.456Z',  '2026-07-15T01:19:04.456Z',       true, '2026-07-14T23:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt",       "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-008', 'VMS-20260714-0008', 'vis-004', 'Pembentangan proposal infrastruktur', 'user-staff-raj',  '2026-07-14T23:43:04.456Z', 'in_progress', 'user-sec-siti', '2026-07-14T22:43:04.456Z',  '2026-07-14T23:13:04.456Z',       true, '2026-07-14T21:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt",       "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-009', 'VMS-20260714-0009', 'vis-007', 'Mesyuarat JKR kerja awam', 'user-staff-hassan',  '2026-07-15T00:13:04.456Z', 'in_progress', 'user-sec-amin', '2026-07-14T23:43:04.456Z',  '2026-07-14T23:55:04.456Z',       true, '2026-07-14T22:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt", "staffVerifiedAt", "staffRemarks",     "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-010', 'VMS-20260714-0010', 'vis-005', 'Temuduga latihan praktikal', 'user-staff-mei',  '2026-07-14T22:43:04.456Z', 'staff_verified', 'user-sec-siti', '2026-07-14T21:43:04.456Z',  '2026-07-14T22:13:04.456Z', '2026-07-14T23:43:04.456Z', 'Temuduga selesai. Calon berpotensi baik.',     true, '2026-07-14T20:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt", "staffVerifiedAt", "staffRemarks",     "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-011', 'VMS-20260714-0011', 'vis-008', 'Pemasangan rangkaian WiFi baharu', 'user-staff-raj',  '2026-07-14T21:43:04.456Z', 'staff_verified', 'user-sec-siti', '2026-07-14T20:43:04.456Z',  '2026-07-14T21:13:04.456Z', '2026-07-14T22:43:04.456Z', 'Pemasangan siap. Test connection berjaya.',     true, '2026-07-14T19:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt", "staffVerifiedAt", "staffRemarks",     "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-012', 'VMS-20260714-0012', 'vis-012', 'Mesyuarat strategik ICT', 'user-staff-raj',  '2026-07-14T23:43:04.456Z', 'staff_verified', 'user-sec-amin', '2026-07-14T22:43:04.456Z',  '2026-07-14T23:13:04.456Z', '2026-07-15T00:43:04.456Z', 'Mesyuarat produktif. Tindakan susulan akan dibuat.',     true, '2026-07-14T21:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt", "staffVerifiedAt", "staffRemarks",     "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-013', 'VMS-20260714-0013', 'vis-010', 'Kerja-kerja pembersihan kawasan', 'user-staff-hassan',  '2026-07-14T22:43:04.456Z', 'pending_feedback', 'user-sec-siti', '2026-07-14T21:43:04.456Z',  '2026-07-14T22:13:04.456Z', '2026-07-14T23:43:04.456Z', 'Kerja selesai mengikut spesifikasi.',     true, '2026-07-14T20:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt", "staffVerifiedAt", "staffRemarks", "feedbackSubmittedAt",    "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-014', 'VMS-20260714-0014', 'vis-013', 'Bengkalai kerjaya kejuruteraan', 'user-staff-hassan',  '2026-07-14T23:43:04.456Z', 'feedback_submitted', 'user-sec-siti', '2026-07-14T22:43:04.456Z',  '2026-07-14T23:13:04.456Z', '2026-07-15T00:13:04.456Z', 'Bengkalai berjaya. Pelajar sangat teruja.', '2026-07-15T00:43:04.456Z',    true, '2026-07-14T21:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt", "staffVerifiedAt", "staffRemarks", "feedbackSubmittedAt",    "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-015', 'VMS-20260714-0015', 'vis-014', 'Penghantaran barang bekalan', 'user-staff-liza',  '2026-07-14T21:43:04.456Z', 'feedback_submitted', 'user-sec-amin', '2026-07-14T20:43:04.456Z',  '2026-07-14T21:13:04.456Z', '2026-07-14T22:43:04.456Z', 'Barang diterima. Resit disahkan.', '2026-07-14T23:13:04.456Z',    true, '2026-07-14T19:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt", "staffVerifiedAt", "staffRemarks", "feedbackSubmittedAt",    "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-016', 'VMS-20260714-0016', 'vis-015', 'Rundingan harga bahan', 'user-staff-liza',  '2026-07-14T22:43:04.456Z', 'feedback_submitted', 'user-sec-siti', '2026-07-14T21:43:04.456Z',  '2026-07-14T22:13:04.456Z', '2026-07-14T23:13:04.456Z', 'Setuju dengan harga baharu.', '2026-07-14T23:43:04.456Z',    true, '2026-07-14T20:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt", "staffVerifiedAt", "staffRemarks", "feedbackSubmittedAt",    "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-017', 'VMS-20260714-0017', 'vis-016', 'Mesyuarat serantau ASEAN', 'user-staff-faizal',  '2026-07-14T20:43:04.456Z', 'ready_for_exit', 'user-sec-siti', '2026-07-14T19:43:04.456Z',  '2026-07-14T20:13:04.456Z', '2026-07-14T21:43:04.456Z', 'Mesyuarat selesai. Minit akan diedarkan.', '2026-07-14T22:13:04.456Z',    true, '2026-07-14T18:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt", "staffVerifiedAt", "staffRemarks", "feedbackSubmittedAt",    "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-018', 'VMS-20260714-0018', 'vis-018', 'Servis peralatan makmal', 'user-staff-hassan',  '2026-07-14T23:43:04.456Z', 'ready_for_exit', 'user-sec-amin', '2026-07-14T22:43:04.456Z',  '2026-07-14T23:13:04.456Z', '2026-07-15T00:13:04.456Z', 'Peralatan berfungsi dengan baik.', '2026-07-15T00:43:04.456Z',    true, '2026-07-14T21:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt", "staffVerifiedAt", "staffRemarks", "feedbackSubmittedAt", "exitConfirmedById", "exitNotes", "checkedOutAt", "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-019', 'VMS-20260713-0019', 'vis-001', 'Mesyuarat mingguan kontraktor', 'user-staff-faizal',  '2026-07-14T01:43:04.456Z', 'checked_out', 'user-sec-siti', '2026-07-14T01:43:04.456Z',  '2026-07-14T01:43:04.456Z', '2026-07-14T01:43:04.456Z', 'Mesyuarat selesai.', '2026-07-14T01:43:04.456Z', 'user-sec-siti', 'Pelawat keluar pukul 5:00 petang.', '2026-07-14T01:43:04.456Z', true, '2026-07-14T01:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt", "staffVerifiedAt", "staffRemarks", "feedbackSubmittedAt", "exitConfirmedById", "exitNotes", "checkedOutAt", "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-020', 'VMS-20260713-0020', 'vis-002', 'Demo perisian', 'user-staff-raj',  '2026-07-13T01:43:04.456Z', 'checked_out', 'user-sec-siti', '2026-07-13T01:43:04.456Z',  '2026-07-13T01:43:04.456Z', '2026-07-13T01:43:04.456Z', 'Demo berjaya.', '2026-07-13T01:43:04.456Z', 'user-sec-siti', 'Biasa.', '2026-07-13T01:43:04.456Z', true, '2026-07-13T01:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt", "staffVerifiedAt", "staffRemarks", "feedbackSubmittedAt", "exitConfirmedById", "exitNotes", "checkedOutAt", "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-021', 'VMS-20260712-0021', 'vis-003', 'Konsultasi kewangan', 'user-staff-liza',  '2026-07-12T01:43:04.456Z', 'checked_out', 'user-sec-amin', '2026-07-12T01:43:04.456Z',  '2026-07-12T01:43:04.456Z', '2026-07-12T01:43:04.456Z', 'Lengkap.', '2026-07-12T01:43:04.456Z', 'user-sec-amin', '-', '2026-07-12T01:43:04.456Z', true, '2026-07-12T01:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt", "staffVerifiedAt", "staffRemarks", "feedbackSubmittedAt", "exitConfirmedById", "exitNotes", "checkedOutAt", "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-022', 'VMS-20260711-0022', 'vis-004', 'Pembentangan infrastruktur', 'user-staff-raj',  '2026-07-11T01:43:04.456Z', 'checked_out', 'user-sec-siti', '2026-07-11T01:43:04.456Z',  '2026-07-11T01:43:04.456Z', '2026-07-11T01:43:04.456Z', 'Baik.', '2026-07-11T01:43:04.456Z', 'user-sec-siti', 'Baik.', '2026-07-11T01:43:04.456Z', true, '2026-07-11T01:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt", "staffVerifiedAt", "staffRemarks", "feedbackSubmittedAt", "exitConfirmedById", "exitNotes", "checkedOutAt", "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-023', 'VMS-20260710-0023', 'vis-005', 'Latihan industri', 'user-staff-mei',  '2026-07-10T01:43:04.456Z', 'checked_out', 'user-sec-siti', '2026-07-10T01:43:04.456Z',  '2026-07-10T01:43:04.456Z', '2026-07-10T01:43:04.456Z', 'Pelajar bersemangat.', '2026-07-10T01:43:04.456Z', 'user-sec-siti', 'Biasa.', '2026-07-10T01:43:04.456Z', true, '2026-07-10T01:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt", "staffVerifiedAt", "staffRemarks", "feedbackSubmittedAt", "exitConfirmedById", "exitNotes", "checkedOutAt", "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-024', 'VMS-20260709-0024', 'vis-007', 'Mesyuarat JKR', 'user-staff-hassan',  '2026-07-09T01:43:04.456Z', 'checked_out', 'user-sec-amin', '2026-07-09T01:43:04.456Z',  '2026-07-09T01:43:04.456Z', '2026-07-09T01:43:04.456Z', 'Mesyuarat selesai.', '2026-07-09T01:43:04.456Z', 'user-sec-amin', 'Biasa.', '2026-07-09T01:43:04.456Z', true, '2026-07-09T01:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt", "staffVerifiedAt", "staffRemarks", "feedbackSubmittedAt", "exitConfirmedById", "exitNotes", "checkedOutAt", "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-025', 'VMS-20260708-0025', 'vis-008', 'Pemasangan rangkaian', 'user-staff-raj',  '2026-07-08T01:43:04.456Z', 'checked_out', 'user-sec-siti', '2026-07-08T01:43:04.456Z',  '2026-07-08T01:43:04.456Z', '2026-07-08T01:43:04.456Z', 'Siap.', '2026-07-08T01:43:04.456Z', 'user-sec-siti', 'Baik.', '2026-07-08T01:43:04.456Z', true, '2026-07-08T01:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt",  "checkedInAt", "staffVerifiedAt", "staffRemarks", "feedbackSubmittedAt", "exitConfirmedById", "exitNotes", "checkedOutAt", "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-026', 'VMS-20260707-0026', 'vis-009', 'Mesyuarat lembaga', 'user-staff-faizal',  '2026-07-07T01:43:04.456Z', 'checked_out', 'user-sec-siti', '2026-07-07T01:43:04.456Z',  '2026-07-07T01:43:04.456Z', '2026-07-07T01:43:04.456Z', 'Produktif.', '2026-07-07T01:43:04.456Z', 'user-sec-siti', 'Baik.', '2026-07-07T01:43:04.456Z', true, '2026-07-07T01:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt", "rejectionReason",        "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-027', 'VMS-20260714-0027', 'vis-010', 'Jualan langsung tidak berjanji temu', 'user-staff-faizal',  '2026-07-14T20:43:04.456Z', 'rejected', 'user-sec-siti', '2026-07-14T20:43:04.456Z', 'Tiada janji temu terdahulu. Sila buat temu janji dahulu.',        true, '2026-07-14T19:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Visit" ("id", "referenceCode", "visitorId", "purpose", "hostStaffId",  "expectedVisitDate", "status", "approvedById", "approvedAt", "rejectionReason",        "pdpaConsent", "createdAt", "updatedAt") VALUES ('visit-028', 'VMS-20260713-0028', 'vis-011', 'Penghantaran tanpa dokumen sokongan', 'user-staff-liza',  '2026-07-14T01:43:04.456Z', 'rejected', 'user-sec-amin', '2026-07-14T01:43:04.456Z', 'Dokumen pengenalan tidak jelas. Sila muat naik semula.',        true, '2026-07-14T01:43:04.456Z', NOW()) ON CONFLICT ("id") DO NOTHING;

-- FEEDBACK
INSERT INTO "Feedback" ("id", "visitId", "rating", "comments", "submittedAt") VALUES (gen_random_uuid()::text, 'visit-014', 5, 'Perkhidmatan cemerlang! Staf sangat membantu dan mesra.', NOW()) ON CONFLICT ("visitId") DO NOTHING;
INSERT INTO "Feedback" ("id", "visitId", "rating", "comments", "submittedAt") VALUES (gen_random_uuid()::text, 'visit-015', 4, 'Proses lancar. Pengawal keselamatan profesional.', NOW()) ON CONFLICT ("visitId") DO NOTHING;
INSERT INTO "Feedback" ("id", "visitId", "rating", "comments", "submittedAt") VALUES (gen_random_uuid()::text, 'visit-016', 5, 'Sangat puas hati dengan kemudahan.', NOW()) ON CONFLICT ("visitId") DO NOTHING;
INSERT INTO "Feedback" ("id", "visitId", "rating", "comments", "submittedAt") VALUES (gen_random_uuid()::text, 'visit-017', 5, 'Mesyuarat berjalan lancar. Susunan tempat sangat baik.', NOW()) ON CONFLICT ("visitId") DO NOTHING;
INSERT INTO "Feedback" ("id", "visitId", "rating", "comments", "submittedAt") VALUES (gen_random_uuid()::text, 'visit-018', 4, 'Pelayanan baik, masa menunggu singkat.', NOW()) ON CONFLICT ("visitId") DO NOTHING;
INSERT INTO "Feedback" ("id", "visitId", "rating", "comments", "submittedAt") VALUES (gen_random_uuid()::text, 'visit-019', 5, 'Sistem baru sangat memudahkan urusan.', NOW()) ON CONFLICT ("visitId") DO NOTHING;
INSERT INTO "Feedback" ("id", "visitId", "rating", "comments", "submittedAt") VALUES (gen_random_uuid()::text, 'visit-020', 4, 'Cemerlang, akan datang lagi.', NOW()) ON CONFLICT ("visitId") DO NOTHING;
INSERT INTO "Feedback" ("id", "visitId", "rating", "comments", "submittedAt") VALUES (gen_random_uuid()::text, 'visit-021', 3, 'Biasa sahaja, tetapi boleh diterima.', NOW()) ON CONFLICT ("visitId") DO NOTHING;
INSERT INTO "Feedback" ("id", "visitId", "rating", "comments", "submittedAt") VALUES (gen_random_uuid()::text, 'visit-022', 5, 'Sangat profesional. Cadangan ditambahbaikkan ruang menunggu.', NOW()) ON CONFLICT ("visitId") DO NOTHING;
INSERT INTO "Feedback" ("id", "visitId", "rating", "comments", "submittedAt") VALUES (gen_random_uuid()::text, 'visit-023', 4, 'Bengkalai bermanfaat, fasilitator baik.', NOW()) ON CONFLICT ("visitId") DO NOTHING;
INSERT INTO "Feedback" ("id", "visitId", "rating", "comments", "submittedAt") VALUES (gen_random_uuid()::text, 'visit-024', 5, 'Mesyuarat efisien. Terima kasih.', NOW()) ON CONFLICT ("visitId") DO NOTHING;
INSERT INTO "Feedback" ("id", "visitId", "rating", "comments", "submittedAt") VALUES (gen_random_uuid()::text, 'visit-025', 2, 'Masa menunggu agak lama di kaunter.', NOW()) ON CONFLICT ("visitId") DO NOTHING;
INSERT INTO "Feedback" ("id", "visitId", "rating", "comments", "submittedAt") VALUES (gen_random_uuid()::text, 'visit-026', 5, 'Pengalaman menyenangkan. Staf sopan.', NOW()) ON CONFLICT ("visitId") DO NOTHING;

-- AUDIT LOGS
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-001', '{"referenceCode":"VMS-20260714-0001"}', '2026-07-15T01:13:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-002', '{"referenceCode":"VMS-20260714-0002"}', '2026-07-15T00:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-003', '{"referenceCode":"VMS-20260714-0003"}', '2026-07-15T01:31:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-004', '{"referenceCode":"VMS-20260714-0004"}', '2026-07-14T22:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_approve', 'visit-004', '{}', '2026-07-14T23:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-005', '{"referenceCode":"VMS-20260714-0005"}', '2026-07-14T23:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_approve', 'visit-005', '{}', '2026-07-15T00:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-006', '{"referenceCode":"VMS-20260714-0006"}', '2026-07-14T22:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-amin', 'security', 'visit_approve', 'visit-006', '{}', '2026-07-14T23:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-amin', 'security', 'visit_checkin', 'visit-006', '{}', '2026-07-15T00:55:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-007', '{"referenceCode":"VMS-20260714-0007"}', '2026-07-14T23:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_approve', 'visit-007', '{}', '2026-07-15T00:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_checkin', 'visit-007', '{}', '2026-07-15T01:19:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-008', '{"referenceCode":"VMS-20260714-0008"}', '2026-07-14T21:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_approve', 'visit-008', '{}', '2026-07-14T22:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_checkin', 'visit-008', '{}', '2026-07-14T23:13:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-009', '{"referenceCode":"VMS-20260714-0009"}', '2026-07-14T22:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-amin', 'security', 'visit_approve', 'visit-009', '{}', '2026-07-14T23:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-amin', 'security', 'visit_checkin', 'visit-009', '{}', '2026-07-14T23:55:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-010', '{"referenceCode":"VMS-20260714-0010"}', '2026-07-14T20:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_approve', 'visit-010', '{}', '2026-07-14T21:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_checkin', 'visit-010', '{}', '2026-07-14T22:13:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-staff-mei', 'staff', 'visit_verify', 'visit-010', '{}', '2026-07-14T23:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-011', '{"referenceCode":"VMS-20260714-0011"}', '2026-07-14T19:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_approve', 'visit-011', '{}', '2026-07-14T20:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_checkin', 'visit-011', '{}', '2026-07-14T21:13:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-staff-raj', 'staff', 'visit_verify', 'visit-011', '{}', '2026-07-14T22:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-012', '{"referenceCode":"VMS-20260714-0012"}', '2026-07-14T21:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-amin', 'security', 'visit_approve', 'visit-012', '{}', '2026-07-14T22:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-amin', 'security', 'visit_checkin', 'visit-012', '{}', '2026-07-14T23:13:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-staff-raj', 'staff', 'visit_verify', 'visit-012', '{}', '2026-07-15T00:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-013', '{"referenceCode":"VMS-20260714-0013"}', '2026-07-14T20:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_approve', 'visit-013', '{}', '2026-07-14T21:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_checkin', 'visit-013', '{}', '2026-07-14T22:13:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-staff-hassan', 'staff', 'visit_verify', 'visit-013', '{}', '2026-07-14T23:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-014', '{"referenceCode":"VMS-20260714-0014"}', '2026-07-14T21:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_approve', 'visit-014', '{}', '2026-07-14T22:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_checkin', 'visit-014', '{}', '2026-07-14T23:13:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-staff-hassan', 'staff', 'visit_verify', 'visit-014', '{}', '2026-07-15T00:13:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_feedback', 'visit-014', '{}', '2026-07-15T00:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-015', '{"referenceCode":"VMS-20260714-0015"}', '2026-07-14T19:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-amin', 'security', 'visit_approve', 'visit-015', '{}', '2026-07-14T20:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-amin', 'security', 'visit_checkin', 'visit-015', '{}', '2026-07-14T21:13:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-staff-liza', 'staff', 'visit_verify', 'visit-015', '{}', '2026-07-14T22:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_feedback', 'visit-015', '{}', '2026-07-14T23:13:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-016', '{"referenceCode":"VMS-20260714-0016"}', '2026-07-14T20:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_approve', 'visit-016', '{}', '2026-07-14T21:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_checkin', 'visit-016', '{}', '2026-07-14T22:13:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-staff-liza', 'staff', 'visit_verify', 'visit-016', '{}', '2026-07-14T23:13:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_feedback', 'visit-016', '{}', '2026-07-14T23:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-017', '{"referenceCode":"VMS-20260714-0017"}', '2026-07-14T18:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_approve', 'visit-017', '{}', '2026-07-14T19:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_checkin', 'visit-017', '{}', '2026-07-14T20:13:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-staff-faizal', 'staff', 'visit_verify', 'visit-017', '{}', '2026-07-14T21:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_feedback', 'visit-017', '{}', '2026-07-14T22:13:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-018', '{"referenceCode":"VMS-20260714-0018"}', '2026-07-14T21:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-amin', 'security', 'visit_approve', 'visit-018', '{}', '2026-07-14T22:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-amin', 'security', 'visit_checkin', 'visit-018', '{}', '2026-07-14T23:13:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-staff-hassan', 'staff', 'visit_verify', 'visit-018', '{}', '2026-07-15T00:13:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_feedback', 'visit-018', '{}', '2026-07-15T00:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-019', '{"referenceCode":"VMS-20260713-0019"}', '2026-07-14T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_approve', 'visit-019', '{}', '2026-07-14T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_checkin', 'visit-019', '{}', '2026-07-14T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-staff-faizal', 'staff', 'visit_verify', 'visit-019', '{}', '2026-07-14T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_feedback', 'visit-019', '{}', '2026-07-14T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_exit', 'visit-019', '{}', '2026-07-14T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-020', '{"referenceCode":"VMS-20260713-0020"}', '2026-07-13T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_approve', 'visit-020', '{}', '2026-07-13T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_checkin', 'visit-020', '{}', '2026-07-13T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-staff-raj', 'staff', 'visit_verify', 'visit-020', '{}', '2026-07-13T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_feedback', 'visit-020', '{}', '2026-07-13T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_exit', 'visit-020', '{}', '2026-07-13T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-021', '{"referenceCode":"VMS-20260712-0021"}', '2026-07-12T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-amin', 'security', 'visit_approve', 'visit-021', '{}', '2026-07-12T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-amin', 'security', 'visit_checkin', 'visit-021', '{}', '2026-07-12T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-staff-liza', 'staff', 'visit_verify', 'visit-021', '{}', '2026-07-12T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_feedback', 'visit-021', '{}', '2026-07-12T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-amin', 'security', 'visit_exit', 'visit-021', '{}', '2026-07-12T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-022', '{"referenceCode":"VMS-20260711-0022"}', '2026-07-11T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_approve', 'visit-022', '{}', '2026-07-11T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_checkin', 'visit-022', '{}', '2026-07-11T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-staff-raj', 'staff', 'visit_verify', 'visit-022', '{}', '2026-07-11T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_feedback', 'visit-022', '{}', '2026-07-11T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_exit', 'visit-022', '{}', '2026-07-11T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-023', '{"referenceCode":"VMS-20260710-0023"}', '2026-07-10T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_approve', 'visit-023', '{}', '2026-07-10T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_checkin', 'visit-023', '{}', '2026-07-10T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-staff-mei', 'staff', 'visit_verify', 'visit-023', '{}', '2026-07-10T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_feedback', 'visit-023', '{}', '2026-07-10T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_exit', 'visit-023', '{}', '2026-07-10T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-024', '{"referenceCode":"VMS-20260709-0024"}', '2026-07-09T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-amin', 'security', 'visit_approve', 'visit-024', '{}', '2026-07-09T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-amin', 'security', 'visit_checkin', 'visit-024', '{}', '2026-07-09T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-staff-hassan', 'staff', 'visit_verify', 'visit-024', '{}', '2026-07-09T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_feedback', 'visit-024', '{}', '2026-07-09T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-amin', 'security', 'visit_exit', 'visit-024', '{}', '2026-07-09T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-025', '{"referenceCode":"VMS-20260708-0025"}', '2026-07-08T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_approve', 'visit-025', '{}', '2026-07-08T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_checkin', 'visit-025', '{}', '2026-07-08T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-staff-raj', 'staff', 'visit_verify', 'visit-025', '{}', '2026-07-08T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_feedback', 'visit-025', '{}', '2026-07-08T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_exit', 'visit-025', '{}', '2026-07-08T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-026', '{"referenceCode":"VMS-20260707-0026"}', '2026-07-07T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_approve', 'visit-026', '{}', '2026-07-07T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_checkin', 'visit-026', '{}', '2026-07-07T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-staff-faizal', 'staff', 'visit_verify', 'visit-026', '{}', '2026-07-07T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_feedback', 'visit-026', '{}', '2026-07-07T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_exit', 'visit-026', '{}', '2026-07-07T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-027', '{"referenceCode":"VMS-20260714-0027"}', '2026-07-14T19:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-siti', 'security', 'visit_reject', 'visit-027', '{}', '2026-07-14T20:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, NULL, 'visitor', 'visit_create', 'visit-028', '{"referenceCode":"VMS-20260713-0028"}', '2026-07-14T01:43:04.456Z');
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "action", "visitId", "details", "createdAt") VALUES (gen_random_uuid()::text, 'user-sec-amin', 'security', 'visit_reject', 'visit-028', '{}', '2026-07-14T01:43:04.456Z');

-- NOTIFICATIONS
INSERT INTO "Notification" ("id", "recipientId", "recipientType", "visitId", "channel", "title", "message", "isRead", "sentAt") VALUES (gen_random_uuid()::text, 'user-staff-faizal', 'staff', 'visit-006', 'in_app', 'Pelawat Telah Tiba', 'Puan Salmiah binti Yusof telah check-in untuk urusan: Rundingan kewangan latihan', false, NOW());
INSERT INTO "Notification" ("id", "recipientId", "recipientType", "visitId", "channel", "title", "message", "isRead", "sentAt") VALUES (gen_random_uuid()::text, 'user-staff-liza', 'staff', 'visit-007', 'in_app', 'Pelawat Telah Tiba', 'Puan Lee Mei Ling telah check-in untuk urusan: Semakan audit kewangan', false, NOW());
INSERT INTO "Notification" ("id", "recipientId", "recipientType", "visitId", "channel", "title", "message", "isRead", "sentAt") VALUES (gen_random_uuid()::text, 'user-staff-raj', 'staff', 'visit-008', 'in_app', 'Pelawat Telah Tiba', 'Encik David Ling telah check-in untuk urusan: Pembentangan proposal infrastruktur', false, NOW());
INSERT INTO "Notification" ("id", "recipientId", "recipientType", "visitId", "channel", "title", "message", "isRead", "sentAt") VALUES (gen_random_uuid()::text, 'user-staff-hassan', 'staff', 'visit-009', 'in_app', 'Pelawat Telah Tiba', 'Puan Faridah binti Omar telah check-in untuk urusan: Mesyuarat JKR kerja awam', false, NOW());

-- SYSTEM SETTINGS
INSERT INTO "SystemSetting" ("id", "key", "value") VALUES (gen_random_uuid()::text, 'staff_verification_sla_hours', '"2"') ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value");
INSERT INTO "SystemSetting" ("id", "key", "value") VALUES (gen_random_uuid()::text, 'data_retention_months', '"12"') ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value");
INSERT INTO "SystemSetting" ("id", "key", "value") VALUES (gen_random_uuid()::text, 'overstay_threshold_minutes', '"180"') ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value");
INSERT INTO "SystemSetting" ("id", "key", "value") VALUES (gen_random_uuid()::text, 'max_upload_size_mb', '"5"') ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value");
INSERT INTO "SystemSetting" ("id", "key", "value") VALUES (gen_random_uuid()::text, 'pdpa_notice_text', '"Maklumat peribadi anda akan dikumpul dan diproses selaras dengan Akta Perlindungan Data Peribadi 2010 (PDPA) bagi tujuan pengurusan lawatan dan keselamatan premis PLTT Bintulu."') ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value");
INSERT INTO "SystemSetting" ("id", "key", "value") VALUES (gen_random_uuid()::text, 'organization_name', '"Pusat Latihan Teknologi Tinggi Bintulu (PLTT Bintulu)"') ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value");
INSERT INTO "SystemSetting" ("id", "key", "value") VALUES (gen_random_uuid()::text, 'organization_short', '"PLTT Bintulu"') ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value");

