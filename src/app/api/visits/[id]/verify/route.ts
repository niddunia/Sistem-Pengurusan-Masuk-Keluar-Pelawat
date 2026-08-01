import { NextRequest } from "next/server";
import { db } from "@/lib/supabase-db";
import { apiSuccess, apiError, logAudit, requireRole, sanitizeString } from "@/lib/api-utils";
import { broadcast } from "@/lib/realtime";

// POST /api/visits/[id]/verify - Staff verifies urusan selesai (Langkah 6)
// Body: { remarks: string } - remarks MANDATORY per FR-23
// Transitions: in_progress -> staff_verified -> pending_feedback (auto)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("staff", "admin");
    if (!session.ok) {
      return apiError(session.error, session.status);
    }

    const { id } = await params;
    const body = await req.json();
    const remarks = sanitizeString(body.remarks, 1000);

    if (!remarks || remarks.length < 5) {
      return apiError("Catatan urusan wajib diisi (minimum 5 aksara) - FR-23.");
    }

    const visit = await db.visit.findUnique({ where: { id } });
    if (!visit) {
      return apiError("Lawatan tidak dijumpai.", 404);
    }

    // Staff can only verify their own visits (admin can verify any)
    if (
      session.session.user.role === "staff" &&
      visit.hostStaffId !== session.session.user.id
    ) {
      return apiError("Anda hanya boleh mengesahkan lawatan anda sendiri.", 403);
    }

    if (visit.status !== "in_progress" && visit.status !== "checked_in") {
      return apiError(
        `Status semasa (${visit.status}) tidak membenarkan pengesahan. Urusan perlu dalam status "In Progress".`
      );
    }

    const now = new Date();
    // Transition to pending_feedback (menunggu maklum balas pelawat)
    const updated = await db.visit.update({
      where: { id },
      data: {
        status: "pending_feedback",
        staffVerifiedAt: now,
        staffRemarks: remarks,
      },
      include: {
        visitor: true,
        hostStaff: { select: { fullName: true } },
      },
    });

    await logAudit({
      action: "visit_verify",
      visitId: id,
      details: { remarks, verifiedBy: session.session.user.name },
    });

    // Realtime: notify security of verification + notify the host staff of status change
    broadcast("visit_verified", "security", { id });
    broadcast(`visit_status_changed`, `user:${visit.hostStaffId}`, { id, status: "pending_feedback" });

    return apiSuccess(updated, "Urusan disahkan selesai. Pelawat diminta mengisi maklum balas.");
  } catch (error) {
    console.error("Verify error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}
