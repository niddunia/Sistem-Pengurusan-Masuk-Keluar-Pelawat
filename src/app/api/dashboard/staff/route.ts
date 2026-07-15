import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, requireRole } from "@/lib/api-utils";

// GET /api/dashboard/staff - Staff dashboard: my visitors (FR-21, FR-22)
export async function GET(_req: NextRequest) {
  try {
    const session = await requireRole("staff", "admin");
    if (!session.ok) {
      return apiError(session.error, session.status);
    }

    const staffId = session.session.user.id;

    const [waiting, inProgress, history, unreadNotifications] = await Promise.all([
      // Visitors waiting / checked in for me
      db.visit.findMany({
        where: {
          hostStaffId: staffId,
          status: { in: ["checked_in", "in_progress"] },
        },
        include: {
          visitor: { select: { fullName: true, company: true, phone: true, email: true, icPassportNo: true } },
          documents: { select: { id: true, fileName: true, filePath: true, mimeType: true } },
        },
        orderBy: { checkedInAt: "desc" },
      }),
      // Verified recently (staff_verified, pending_feedback) - just done
      db.visit.findMany({
        where: {
          hostStaffId: staffId,
          status: { in: ["staff_verified", "pending_feedback", "feedback_submitted", "ready_for_exit"] },
        },
        include: {
          visitor: { select: { fullName: true, company: true } },
          feedback: { select: { rating: true, comments: true } },
        },
        orderBy: { staffVerifiedAt: "desc" },
        take: 10,
      }),
      // History
      db.visit.findMany({
        where: {
          hostStaffId: staffId,
          status: { in: ["checked_out", "rejected", "cancelled"] },
        },
        include: {
          visitor: { select: { fullName: true, company: true } },
          feedback: { select: { rating: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      // Unread notifications
      db.notification.count({
        where: {
          recipientId: staffId,
          isRead: false,
        },
      }),
    ]);

    return apiSuccess({
      counts: {
        waiting: waiting.length,
        inProgress: inProgress.length,
        history: history.length,
        unreadNotifications,
      },
      waiting,
      inProgress,
      history,
    });
  } catch (error) {
    console.error("Staff dashboard error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}
