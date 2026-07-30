# Sistem Pengurusan Masuk-Keluar Pelawat (VMS)

**Visitor Entry & Exit Management System** for **Pusat Latihan Teknologi Tinggi Bintulu (PLTT Bintulu)**, Jabatan Tenaga Manusia (JTM), Malaysia.

A comprehensive, secure, and modern visitor management system built with Next.js 16, featuring a glassmorphism UI/UX design, role-based access control, full audit trails, and PDPA 2010 compliance.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [User Roles](#user-roles)
- [Tech Stack](#tech-stack)
- [Demo Credentials](#demo-credentials)
- [Quick Start](#quick-start)
- [Database Setup (Supabase)](#database-setup-supabase)
- [Project Structure](#project-structure)
- [Security Features](#security-features)
- [License](#license)

---

## Overview

This system digitizes the entire visitor management workflow at PLTT Bintulu — from visitor self-registration and ID document upload, through security approval, staff verification, feedback collection, and final exit approval. It replaces the manual paper logbook with a secure, auditable, real-time digital system.

### Key Capabilities

- ✅ **11-step visitor workflow** with enforced state machine
- ✅ **4 user roles** with role-based access control (RBAC)
- ✅ **Glassmorphism UI/UX** — modern, responsive, bilingual (BM/EN)
- ✅ **Real-time dashboard** with auto-refresh
- ✅ **Full audit trail** — every action logged immutably
- ✅ **PDPA 2010 compliant** — explicit consent, data retention policies
- ✅ **Security gates** — exit only allowed after staff verification + feedback
- ✅ **Analytics & reporting** — KPIs, charts, CSV export
- ✅ **Dark mode** support

---

## Features

### Visitor Portal (Public — No Login)
- Multi-step registration form (Information → Upload ID → Review & Submit)
- ID document upload (JPG/PNG/PDF, max 5MB) with preview
- PDPA consent enforcement
- Real-time status check by reference code
- Star-rating feedback form

### Security Guard Dashboard
- KPI cards: Pending approvals, Active visitors, Ready for exit, Overstay alerts
- Tabbed interface: Pending / Active / Ready / Overstay
- Approve/reject visitor applications with reason logging
- Walk-in registration (register on behalf of visitor)
- Exit approval with double-check gate enforcement
- Overstay alerts (visitors exceeding 3-hour threshold)
- Visit history with filters and search

### Staff JTM Dashboard
- List of visitors waiting for verification
- Verify visit completion with mandatory remarks (audit trail)
- Visit history with ratings and feedback
- In-app notifications when visitors check in

### Admin Dashboard
- **Analytics**: KPI cards, daily trend charts, status breakdown, department breakdown
- **User Management**: CRUD for security/staff/admin accounts
- **Department Management**: Create/delete departments
- **Audit Log Viewer**: Filterable, paginated, with detail view
- **System Settings**: SLA hours, data retention, PDPA notice text
- **Reports & Export**: CSV export with date/status filters

---

## User Roles

| Role | Access | Capabilities |
|------|--------|-------------|
| **Pelawat (Visitor)** | Public — no login | Register visit, upload ID, check status, submit feedback |
| **Pengawal Keselamatan (Security)** | Authenticated | Approve/reject, check-in, walk-in registration, exit approval |
| **Staf JTM (Staff)** | Authenticated | View assigned visitors, verify completion with remarks |
| **Admin / Penyelia** | Authenticated | Full access: users, departments, analytics, audit logs, settings |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) + TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui (New York) + Glassmorphism |
| **Database** | PostgreSQL (Supabase) + Prisma ORM |
| **Authentication** | NextAuth.js v4 (Credentials provider, JWT sessions) |
| **Password Security** | bcryptjs (salted hashing) |
| **State Management** | Zustand (client) + React Server Components |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Realtime** | Socket.io (mini-service on port 3003) |
| **Fonts** | Poppins (headings) + Inter (body) |

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `rohana@pltbintulu.gov.my` | `password123` |
| Security | `siti@pltbintulu.gov.my` | `password123` |
| Staff | `faizal@pltbintulu.gov.my` | `password123` |

> ⚠️ **Change these passwords immediately in production.** The seed script creates accounts with `password123` for demonstration only.

---

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- A Supabase project (or PostgreSQL database)

### Installation

```bash
# Clone the repository
git clone https://github.com/niddunia/Sistem-Pengurusan-Masuk-Keluar-Pelawat.git
cd Sistem-Pengurusan-Masuk-Keluar-Pelawat

# Install dependencies
bun install
# or: npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your Supabase connection string
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:YOUR-PASSWORD@db.YOUR-PROJECT-REF.supabase.co:5432/postgres

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

### Database Setup

```bash
# Push schema to create all tables
bun run db:push

# Generate Prisma client
bun run db:generate

# Seed database with dummy data
bun run db:seed
```

### Run the Development Server

```bash
bun run dev
# or: npm run dev
```

The app will be available at `http://localhost:3000`.

### (Optional) Start the Realtime Service

```bash
cd mini-services/realtime-service
bun install
bun run dev
```

This starts a Socket.io server on port 3003 for real-time visit status broadcasts. The app works without it (falls back to polling).

---

## Database Setup (Supabase)

### Option A: Automatic (if pooler is enabled)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your connection string from Project Settings → Database
3. Add it to `.env` as `DATABASE_URL`
4. Run:
   ```bash
   bun run db:push    # Creates tables
   bun run db:seed    # Populates with demo data
   ```

### Option B: Manual (via Supabase SQL Editor)

If the direct connection is blocked (e.g., IPv6-only, firewall):

1. Open the `supabase-setup.sql` file in the project root
2. Go to Supabase Dashboard → SQL Editor → New Query
3. Paste the entire SQL content and click **Run**
4. This creates all tables and inserts all seed data

---

## Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database schema (10 models)
│   └── seed.ts                # Seed script with dummy data
├── src/
│   ├── app/
│   │   ├── api/               # API routes (20+ endpoints)
│   │   │   ├── auth/[...nextauth]/    # NextAuth handler
│   │   │   ├── visits/                 # Visit CRUD + status transitions
│   │   │   ├── dashboard/              # Role-specific dashboard data
│   │   │   ├── admin/                  # Admin: users, departments, audit, settings, export
│   │   │   ├── staff/                  # Staff list (for dropdowns)
│   │   │   ├── departments/            # Department list
│   │   │   └── upload/                 # File upload handler
│   │   ├── globals.css        # Glassmorphism design system
│   │   ├── layout.tsx         # Root layout (fonts, providers)
│   │   └── page.tsx           # Main page (view router)
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── vms/
│   │       ├── views/         # 17 view components (4 roles)
│   │       ├── AppShell.tsx   # Header + Footer
│   │       ├── AppSidebar.tsx # Role-based sidebar navigation
│   │       ├── GlassCard.tsx  # Glassmorphism card + button
│   │       ├── StatusBadge.tsx# Visit status badges
│   │       └── Stepper.tsx    # Multi-step form indicator
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── db.ts              # Prisma client
│   │   ├── api-utils.ts       # API helpers (audit, rate limit, validation)
│   │   ├── i18n.ts            # Bilingual translations (BM/EN)
│   │   └── realtime.ts        # Socket.io broadcast helper
│   ├── stores/
│   │   └── router.ts          # Zustand view router + UI state
│   └── hooks/
│       └── useRealtime.ts     # Socket.io client hook
├── mini-services/
│   └── realtime-service/      # Socket.io server (port 3003)
├── public/
│   ├── uploads/               # Uploaded ID documents (gitignored)
│   └── logo.svg
├── supabase-setup.sql         # Complete SQL for manual Supabase setup
├── .env.example               # Environment template
└── package.json
```

---

## Security Features

### Authentication & Authorization
- **NextAuth.js** with JWT sessions (8-hour expiry)
- **bcryptjs** password hashing (10 salt rounds)
- **Role-based access control** — every API endpoint validates the user's role
- **Session validation** on all authenticated routes

### Data Protection (PDPA 2010)
- **Explicit consent** — visitors must check the PDPA consent checkbox to register
- **PDPA notice** displayed on the registration form
- **Data retention policy** configurable by admin (default: 12 months)
- **Soft-delete only** — no hard deletes (audit trail integrity)
- **IP address & user agent** logged on every audit entry

### Input Security
- **Server-side input validation** on all API endpoints (Zod-style validation)
- **Input sanitization** — HTML tags stripped, length limits enforced
- **Rate limiting** — public endpoints (registration, status check, feedback, upload) are rate-limited
- **File upload validation** — MIME type whitelist (JPG/PNG/PDF), 5MB max size

### State Machine Enforcement
The visit status transition is enforced at the **database/API level**, not just UI:
- Exit (`checked_out`) only allowed if `staffVerifiedAt IS NOT NULL` AND `feedbackSubmittedAt IS NOT NULL`
- This prevents bypassing the security gate even via direct API calls
- Override mode requires a mandatory reason (min 10 chars) logged to audit trail

### Audit Trail
- Every status change logged to `audit_logs` table with:
  - Actor ID and role
  - Action type
  - Timestamp
  - IP address and user agent
  - Additional details (JSON)
- Audit logs are **immutable** (append-only, no delete)

---

## Visit Status State Machine

```
pending_approval → approved → checked_in → in_progress → staff_verified
                                                              ↓
                                                        pending_feedback
                                                              ↓
                                                        feedback_submitted
                                                              ↓
                                                         ready_for_exit
                                                              ↓
                                                         checked_out

pending_approval → rejected (final)
any pre-approval → cancelled (final)
```

**Critical gate**: `ready_for_exit → checked_out` only allowed when BOTH:
- `staff_verified_at IS NOT NULL`
- `feedback_submitted_at IS NOT NULL`

---

## License

This project is **SULIT / CONFIDENTIAL** — for internal use by PLTT Bintulu & JTM only.

© 2026 Pusat Latihan Teknologi Tinggi Bintulu (PLTT Bintulu), Jabatan Tenaga Manusia (JTM). All Rights Reserved.

---

## Acknowledgments

- **AI Development Partner**: Z.ai (GLM-5.2)
- **Backend / Database**: Supabase (PostgreSQL)
- **Design Language**: Modern Glassmorphism UI/UX
- **Built for**: PLTT Bintulu, JTM, Kementerian Sumber Manusia Malaysia
