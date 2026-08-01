import { NextRequest } from "next/server";
import { db } from "@/lib/supabase-db";
import { apiSuccess, apiError, logAudit, requireRole, sanitizeString } from "@/lib/api-utils";
import { broadcast } from "@/lib/realtime";

// POST /api/visits/[id]/approve - Security approves visit (Langkah 4)
// Body: { notes?: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("security");
    if (!session.ok) {
      return apiError(session.error, session.status);
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const notes = body.notes ? sanitizeString(body.notes, 500) : null;

    const visit = await db.visit.findUnique({ where: { id } });
    if (!visit) {
      return apiError("Lawatan tidak dijumpai.", 404);
    }
    if (visit.status !== "pending_approval") {
      return apiError(`Status semasa (${visit.status}) tidak membenarkan kelulusan.`);
    }

    const updated = await db.visit.update({
      where: { id },
      data: {
        status: "approved",
        approvedById: session.session.user.id,
        approvedAt: new Date(),
      },
      include: {
        visitor: true,
        hostStaff: { select: { fullName: true, email: true, phone: true } },
      },
    });

    // Notify host staff
    await db.notification.create({
      data: {
        recipientId: visit.hostStaffId,
        recipientType: "staff",
        visitId: visit.id,
        channel: "in_app",
        title: "Pelawat Diluluskan",
        message: `${updated.visitor.fullName} telah diluluskan untuk lawatan.`,
      },
    });

    await logAudit({
      action: "visit_approve",
      visitId: id,
      details: { notes, visitorName: updated.visitor.fullName },
    });

    // Realtime: notify security of approval + notify staff of status change
    broadcast("visit_approved", "security", { id });
    broadcast("visit_status_changed", "staff", { id, status: "approved" });

    return apiSuccess(updated, "Permohonan diluluskan. Pelawat kini boleh check-in.");
  } catch (error) {
    console.error("Approve error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}
