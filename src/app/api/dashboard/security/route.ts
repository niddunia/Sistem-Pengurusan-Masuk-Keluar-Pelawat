import { NextRequest } from "next/server";
import { db } from "@/lib/supabase-db";
import { apiSuccess, apiError, requireRole } from "@/lib/api-utils";

// GET /api/dashboard/security - Security dashboard stats (FR-11, FR-14, FR-15, FR-16)
export async function GET(_req: NextRequest) {
  try {
    const session = await requireRole("security", "admin");
    if (!session.ok) {
      return apiError(session.error, session.status);
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const overstayThreshold = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 hours

    const [
      pendingApproval,
      activeVisitors,
      readyForExit,
      checkedOutToday,
      totalToday,
      overstayVisits,
    ] = await Promise.all([
      // Pending approval
      db.visit.findMany({
        where: { status: "pending_approval" },
        include: {
          visitor: { select: { fullName: true, icPassportNo: true, phone: true, company: true } },
          hostStaff: { select: { fullName: true, department: { select: { name: true } } } },
          documents: { select: { id: true, fileName: true, filePath: true, mimeType: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      // Active in premis (checked_in, in_progress, staff_verified, pending_feedback, feedback_submitted)
      db.visit.findMany({
        where: {
          status: { in: ["checked_in", "in_progress", "staff_verified", "pending_feedback", "feedback_submitted", "ready_for_exit"] },
        },
        include: {
          visitor: { select: { fullName: true, icPassportNo: true, phone: true, company: true } },
          hostStaff: { select: { fullName: true, department: { select: { name: true } } } },
          feedback: { select: { rating: true } },
        },
        orderBy: { checkedInAt: "desc" },
      }),
      // Ready for exit (both conditions met)
      db.visit.findMany({
        where: {
          status: { in: ["feedback_submitted", "ready_for_exit"] },
          staffVerifiedAt: { not: null },
          feedbackSubmittedAt: { not: null },
        },
        include: {
          visitor: { select: { fullName: true, company: true, phone: true } },
          hostStaff: { select: { fullName: true } },
          feedback: { select: { rating: true, comments: true } },
        },
        orderBy: { feedbackSubmittedAt: "desc" },
      }),
      // Checked out today
      db.visit.count({
        where: {
          status: "checked_out",
          checkedOutAt: { gte: todayStart },
        },
      }),
      // Total visits today
      db.visit.count({
        where: { createdAt: { gte: todayStart } },
      }),
      // Overstay alerts (checked in > 3 hours ago, not yet checked out)
      db.visit.findMany({
        where: {
          status: { in: ["checked_in", "in_progress"] },
          checkedInAt: { lt: overstayThreshold },
        },
        include: {
          visitor: { select: { fullName: true, phone: true } },
          hostStaff: { select: { fullName: true } },
        },
      }),
    ]);

    return apiSuccess({
      counts: {
        pendingApproval: pendingApproval.length,
        activeVisitors: activeVisitors.length,
        readyForExit: readyForExit.length,
        checkedOutToday,
        totalToday,
        overstay: overstayVisits.length,
      },
      pendingApproval,
      activeVisitors,
      readyForExit,
      overstayVisits,
    });
  } catch (error) {
    console.error("Security dashboard error:", error);
    return apiError("Ralat pelayan: " + (error as Error).message, 500);
  }
}
