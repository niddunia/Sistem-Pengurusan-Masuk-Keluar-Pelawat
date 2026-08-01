import { NextRequest } from "next/server";
import { db } from "@/lib/supabase-db";
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

    // Fetch all visits with relations
    const allVisits = await db.visit.findMany({
      include: {
        visitor: true,
        hostStaff: true,
        feedback: true,
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    // Fetch departments
    const departments = await db.department.findMany();

    // Count visitors and users via REST count
    const totalVisitors = await db.visitor.count();
    const totalUsers = await db.profile.count({ where: { isActive: true } });

    // Compute visit counts
    const totalVisits = allVisits.filter(v => new Date(v.createdAt) >= startDate).length;
    const activeVisitors = allVisits.filter(v => ["checked_in", "in_progress", "staff_verified", "pending_feedback", "feedback_submitted", "ready_for_exit"].includes(v.status)).length;
    const pendingApproval = allVisits.filter(v => v.status === "pending_approval").length;

    // Status breakdown
    const statusMap = new Map<string, number>();
    for (const v of allVisits) {
      statusMap.set(v.status, (statusMap.get(v.status) || 0) + 1);
    }
    const statusBreakdown = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

    // Feedback stats
    const feedbackList = allVisits.filter(v => v.feedback).map(v => v.feedback);
    const avgRating = feedbackList.length > 0 ? feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length : 0;

    // Daily trend
    const trendMap = new Map<string, { date: string; count: number; completed: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      trendMap.set(key, { date: key, count: 0, completed: 0 });
    }
    for (const v of allVisits) {
      const key = new Date(v.createdAt).toISOString().slice(0, 10);
      const entry = trendMap.get(key);
      if (entry) {
        entry.count++;
        if (v.status === "checked_out") entry.completed++;
      }
    }

    // Department breakdown
    const deptCountMap = new Map<string, number>();
    for (const v of allVisits) {
      const deptId = (v.hostStaff as Record<string, unknown>)?.departmentId as string;
      if (deptId) {
        deptCountMap.set(deptId, (deptCountMap.get(deptId) || 0) + 1);
      }
    }
    const deptMap = new Map(departments.map(d => [d.id, d.name]));
    const departmentBreakdown = Array.from(deptCountMap.entries())
      .map(([deptId, count]) => ({
        name: deptMap.get(deptId) || "Unknown",
        visitCount: count,
      }))
      .sort((a, b) => b.visitCount - a.visitCount);

    // Recent visits (first 10)
    const recentVisits = allVisits.slice(0, 10);

    return apiSuccess({
      counts: {
        totalVisits,
        totalVisitors,
        totalUsers,
        activeVisitors,
        pendingApproval,
      },
      feedback: {
        averageRating: avgRating ? Number(avgRating.toFixed(2)) : 0,
        totalFeedback: feedbackList.length,
      },
      statusBreakdown,
      dailyTrend: Array.from(trendMap.values()),
      departmentBreakdown,
      recentVisits,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return apiError("Ralat pelayan: " + (error as Error).message, 500);
  }
}
