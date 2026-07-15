import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, logAudit, requireRole, sanitizeString } from "@/lib/api-utils";

// GET /api/visits/list?status=...&role=... - List visits with filters
export async function GET(req: NextRequest) {
  try {
    const session = await requireRole("security", "staff", "admin");
    if (!session.ok) {
      return apiError(session.error, session.status);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Staff can only see their own visits
    const where: Record<string, unknown> = {};
    if (session.session.user.role === "staff") {
      where.hostStaffId = session.session.user.id;
    }
    if (status && status !== "all") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { referenceCode: { contains: search } },
        { visitor: { fullName: { contains: search } } },
        { visitor: { icPassportNo: { contains: search } } },
        { visitor: { phone: { contains: search } } },
        { visitor: { company: { contains: search } } },
      ];
    }

    const visits = await db.visit.findMany({
      where,
      include: {
        visitor: {
          select: { id: true, fullName: true, icPassportNo: true, phone: true, company: true, email: true },
        },
        hostStaff: {
          select: { id: true, fullName: true, department: { select: { name: true } } },
        },
        approvedBy: { select: { fullName: true } },
        exitConfirmedBy: { select: { fullName: true } },
        feedback: { select: { rating: true, comments: true } },
        documents: { select: { id: true, fileName: true, docType: true, filePath: true, mimeType: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return apiSuccess(visits);
  } catch (error) {
    console.error("List visits error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}
