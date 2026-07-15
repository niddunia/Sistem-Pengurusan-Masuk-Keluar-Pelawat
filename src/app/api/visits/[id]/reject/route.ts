import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, logAudit, requireRole, sanitizeString } from "@/lib/api-utils";
import { broadcast } from "@/lib/realtime";

// POST /api/visits/[id]/reject - Security rejects visit (Langkah 4 exception)
// Body: { reason: string }
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
    const body = await req.json();
    const reason = sanitizeString(body.reason, 500);

    if (!reason || reason.length < 5) {
      return apiError("Sebab penolakan wajib diisi (minimum 5 aksara).");
    }

    const visit = await db.visit.findUnique({ where: { id } });
    if (!visit) {
      return apiError("Lawatan tidak dijumpai.", 404);
    }
    if (visit.status !== "pending_approval") {
      return apiError(`Status semasa (${visit.status}) tidak membenarkan penolakan.`);
    }

    const updated = await db.visit.update({
      where: { id },
      data: {
        status: "rejected",
        approvedById: session.session.user.id,
        approvedAt: new Date(),
        rejectionReason: reason,
      },
      include: { visitor: true },
    });

    await logAudit({
      action: "visit_reject",
      visitId: id,
      details: { reason, visitorName: updated.visitor.fullName },
    });

    // Realtime: notify security clients of the rejection
    broadcast("visit_status_changed", "security", { id, status: "rejected" });

    return apiSuccess(updated, "Permohonan ditolak. Pelawat akan dimaklumkan.");
  } catch (error) {
    console.error("Reject error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}
