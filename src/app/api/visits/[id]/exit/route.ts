import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, logAudit, requireRole, sanitizeString } from "@/lib/api-utils";
import { broadcast } from "@/lib/realtime";

// POST /api/visits/[id]/exit - Security allows exit (Langkah 11)
// SECURITY GATE: Only allowed if staff_verified_at AND feedback_submitted_at are NOT NULL (FR-17)
// Body: { notes?: string }
// Transitions: feedback_submitted OR ready_for_exit -> checked_out
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
    const override = body.override === true;
    const overrideReason = body.overrideReason ? sanitizeString(body.overrideReason, 500) : null;

    const visit = await db.visit.findUnique({ where: { id } });
    if (!visit) {
      return apiError("Lawatan tidak dijumpai.", 404);
    }

    // === CRITICAL SECURITY GATE (FR-17, PRD Section 7) ===
    // Exit only allowed if BOTH conditions met: staff_verified AND feedback_submitted
    const staffVerified = !!visit.staffVerifiedAt;
    const feedbackSubmitted = !!visit.feedbackSubmittedAt;

    if ((!staffVerified || !feedbackSubmitted) && !override) {
      const missing = [];
      if (!staffVerified) missing.push("Pengesahan Staf");
      if (!feedbackSubmitted) missing.push("Maklum Balas Pelawat");
      return apiError(
        `Syarat keluar belum dipenuhi. Belum selesai: ${missing.join(" & ")}.`,
        403
      );
    }

    // If override, require reason (PRD exception path)
    if (override && (!overrideReason || overrideReason.length < 10)) {
      return apiError("Sebab override wajib diisi (minimum 10 aksara) untuk audit log.", 400);
    }

    // Mark as ready_for_exit first if not already
    let finalVisit = visit;
    if (visit.status === "feedback_submitted") {
      finalVisit = await db.visit.update({
        where: { id },
        data: { status: "ready_for_exit" },
      });
    }

    const now = new Date();
    const updated = await db.visit.update({
      where: { id },
      data: {
        status: "checked_out",
        exitConfirmedById: session.session.user.id,
        exitNotes: notes || (override ? `[OVERRIDE] ${overrideReason}` : null),
        checkedOutAt: now,
      },
      include: {
        visitor: { select: { fullName: true } },
        hostStaff: { select: { fullName: true } },
      },
    });

    await logAudit({
      action: "visit_exit",
      visitId: id,
      details: {
        notes,
        override,
        overrideReason,
        staffVerified,
        feedbackSubmitted,
      },
    });

    // Realtime: notify security that the visitor has exited
    broadcast("visit_exited", "security", { id });

    return apiSuccess(updated, "Pelawat berjaya didaftarkan keluar. Rekod lawatan ditutup.");
  } catch (error) {
    console.error("Exit error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}
