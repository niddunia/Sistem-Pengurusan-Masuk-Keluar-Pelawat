import { NextRequest } from "next/server";
import { db } from "@/lib/supabase-db";
import { apiSuccess, apiError, logAudit, requireRole } from "@/lib/api-utils";
import { broadcast } from "@/lib/realtime";

// POST /api/visits/[id]/checkin - Security checks in visitor (Langkah 4 -> checked_in)
// Transitions: approved -> checked_in -> in_progress (auto)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("security");
    if (!session.ok) {
      return apiError(session.error, session.status);
    }

    const { id } = await params;
    const visit = await db.visit.findUnique({ where: { id } });
    if (!visit) {
      return apiError("Lawatan tidak dijumpai.", 404);
    }

    if (visit.status !== "approved" && visit.status !== "checked_in") {
      return apiError(
        `Status semasa (${visit.status}) tidak membenarkan check-in. Pelawat perlu diluluskan terlebih dahulu.`
      );
    }

    // Transition to in_progress (urusan sedang berjalan)
    const updated = await db.visit.update({
      where: { id },
      data: {
        status: "in_progress",
        checkedInAt: visit.checkedInAt || new Date(),
      },
      include: {
        visitor: true,
        hostStaff: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });

    // Notify host staff
    await db.notification.create({
      data: {
        recipientId: visit.hostStaffId,
        recipientType: "staff",
        visitId: visit.id,
        channel: "in_app",
        title: "Pelawat Telah Tiba",
        message: `${updated.visitor.fullName} telah check-in untuk urusan: ${visit.purpose}`,
      },
    });

    await logAudit({
      action: "visit_checkin",
      visitId: id,
      details: { checkedInAt: updated.checkedInAt },
    });

    // Realtime: notify staff (host) of check-in + notify security of status change
    broadcast("visit_checked_in", "staff", { id, hostStaffId: visit.hostStaffId });
    broadcast("visit_status_changed", "security", { id });

    return apiSuccess(updated, "Pelawat berjaya didaftarkan masuk. Staf tuan rumah dimaklumkan.");
  } catch (error) {
    console.error("Checkin error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}
