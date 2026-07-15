import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, logAudit, rateLimit, sanitizeString } from "@/lib/api-utils";
import { broadcast } from "@/lib/realtime";

// POST /api/visits/[id]/feedback - Visitor submits feedback (Langkah 8)
// Body: { rating: number (1-5), comments?: string }
// Public endpoint - visitor provides reference via visit lookup
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit("feedback-submit", 10, 60_000);
    if (!rl.allowed) {
      return apiError("Terlalu banyak percubaan.", 429);
    }

    const { id } = await params;
    const body = await req.json();
    const rating = Math.round(Number(body.rating));
    const comments = body.comments ? sanitizeString(body.comments, 1000) : null;

    if (!rating || rating < 1 || rating > 5) {
      return apiError("Penilaian mesti antara 1-5 bintang.");
    }

    const visit = await db.visit.findUnique({ where: { id } });
    if (!visit) {
      return apiError("Lawatan tidak dijumpai.", 404);
    }

    if (visit.status !== "pending_feedback" && visit.status !== "staff_verified") {
      return apiError(
        `Status semasa (${visit.status}) tidak membenarkan maklum balas. Urusan perlu disahkan staf terlebih dahulu.`
      );
    }

    // Check if feedback already exists
    const existing = await db.feedback.findUnique({ where: { visitId: id } });
    if (existing) {
      return apiError("Maklum balas untuk lawatan ini telah dihantar sebelumnya.");
    }

    const now = new Date();
    await db.feedback.create({
      data: {
        visitId: id,
        rating,
        comments,
      },
    });

    const updated = await db.visit.update({
      where: { id },
      data: {
        status: "feedback_submitted",
        feedbackSubmittedAt: now,
      },
      include: { visitor: { select: { fullName: true } } },
    });

    await logAudit({
      action: "visit_feedback",
      visitId: id,
      details: { rating, comments: comments?.slice(0, 200) },
      actorRole: "visitor",
    });

    // Realtime: notify security that feedback has been submitted
    broadcast("visit_status_changed", "security", { id, status: "feedback_submitted" });

    return apiSuccess(updated, "Terima kasih! Maklum balas anda telah dihantar.");
  } catch (error) {
    console.error("Feedback error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}
