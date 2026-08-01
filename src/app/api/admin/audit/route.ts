import { NextRequest } from "next/server";
import { db } from "@/lib/supabase-db";
import { apiSuccess, apiError, requireRole } from "@/lib/api-utils";

// GET /api/admin/audit - Audit logs with filters (FR-30)
// Query: ?action=...&actorId=...&visitId=...&from=...&to=...&page=1&limit=50
export async function GET(req: NextRequest) {
  try {
    const session = await requireRole("admin");
    if (!session.ok) {
      return apiError(session.error, session.status);
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const actorId = searchParams.get("actorId");
    const visitId = searchParams.get("visitId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (actorId) where.actorId = actorId;
    if (visitId) where.visitId = visitId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from).toISOString();
      if (to) where.createdAt.lte = new Date(to).toISOString();
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          actor: { select: { fullName: true, email: true, role: true } },
          visit: { select: { referenceCode: true, visitor: { select: { fullName: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ]);

    return apiSuccess({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Audit logs error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}
