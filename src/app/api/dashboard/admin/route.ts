import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, requireRole } from "@/lib/api-utils";

// GET /api/dashboard/admin - Admin analytics dashboard (FR-29, FR-30)
export async function GET(req: NextRequest) {
  try {
    const session = await requireRole("admin");
    if (!session.ok) {
      return apiError(session.error, session.status);
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const [
      totalVisits,
      totalVisitors,
      totalUsers,
      activeVisitors,
      pendingApproval,
      visitsByStatus,
      feedbackStats,
      dailyTrend,
      departmentStatsRaw,
      recentVisits,
    ] = await Promise.all([
      db.visit.count({ where: { createdAt: { gte: startDate } } }),
      db.visitor.count(),
      db.profile.count({ where: { isActive: true } }),
      db.visit.count({
        where: {
          status: { in: ["checked_in", "in_progress", "staff_verified", "pending_feedback", "feedback_submitted", "ready_for_exit"] },
        },
      }),
      db.visit.count({ where: { status: "pending_approval" } }),
      // Visits by status
      db.visit.groupBy({
        by: ["status"],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      // Feedback stats
      db.feedback.aggregate({
        where: { visit: { createdAt: { gte: startDate } } },
        _avg: { rating: true },
        _count: true,
      }),
      // Daily trend (last N days)
      db.visit.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true, status: true },
      }),
      // Department stats — fetch visits with hostStaff.departmentId, group in JS
      db.visit.findMany({
        select: {
          hostStaff: { select: { departmentId: true } },
        },
        where: { hostStaff: { departmentId: { not: null } } },
      }),
      // Recent visits
      db.visit.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          visitor: { select: { fullName: true, company: true } },
          hostStaff: { select: { fullName: true, department: { select: { name: true } } } },
          feedback: { select: { rating: true } },
        },
      }),
    ]);

    // Process daily trend
    const trendMap = new Map<string, { date: string; count: number; completed: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      trendMap.set(key, { date: key, count: 0, completed: 0 });
    }
    for (const v of dailyTrend) {
      const key = v.createdAt.toISOString().slice(0, 10);
      const entry = trendMap.get(key);
      if (entry) {
        entry.count++;
        if (v.status === "checked_out") entry.completed++;
      }
    }

    // Aggregate department visit counts in JS
    const deptCountMap = new Map<string, number>();
    for (const v of departmentStatsRaw) {
      const deptId = v.hostStaff?.departmentId;
      if (!deptId) continue;
      deptCountMap.set(deptId, (deptCountMap.get(deptId) || 0) + 1);
    }
    const deptIds = Array.from(deptCountMap.keys());
    const departments = await db.department.findMany({
      where: { id: { in: deptIds } },
    });
    const deptMap = new Map(departments.map((d) => [d.id, d.name]));
    const departmentBreakdown = Array.from(deptCountMap.entries())
      .map(([deptId, count]) => ({
        name: deptMap.get(deptId) || "Unknown",
        visitCount: count,
      }))
      .sort((a, b) => b.visitCount - a.visitCount);

    // Status breakdown
    const statusBreakdown = visitsByStatus.map((s) => ({
      status: s.status,
      count: s._count,
    }));

    return apiSuccess({
      counts: {
        totalVisits,
        totalVisitors,
        totalUsers,
        activeVisitors,
        pendingApproval,
      },
      feedback: {
        averageRating: feedbackStats._avg.rating ? Number(feedbackStats._avg.rating.toFixed(2)) : 0,
        totalFeedback: feedbackStats._count,
      },
      statusBreakdown,
      dailyTrend: Array.from(trendMap.values()),
      departmentBreakdown,
      recentVisits,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}
