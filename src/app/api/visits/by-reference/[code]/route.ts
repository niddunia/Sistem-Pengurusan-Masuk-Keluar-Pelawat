import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, rateLimit, sanitizeString } from "@/lib/api-utils";

// GET /api/visits/by-reference/[code] - Public status check by reference code (FR-05)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const rl = rateLimit("status-check", 30, 60_000);
    if (!rl.allowed) {
      return apiError("Terlalu banyak percubaan. Sila cuba sebentar lagi.", 429);
    }

    const { code } = await params;
    const referenceCode = sanitizeString(code, 30);

    if (!referenceCode) {
      return apiError("Kod rujukan diperlukan.");
    }

    const visit = await db.visit.findUnique({
      where: { referenceCode },
      include: {
        visitor: {
          select: { fullName: true, company: true },
        },
        hostStaff: {
          select: { fullName: true, department: { select: { name: true } } },
        },
        feedback: { select: { rating: true, comments: true } },
      },
    });

    if (!visit) {
      return apiError("Kod rujukan tidak dijumpai. Sila semak semula.", 404);
    }

    return apiSuccess({
      id: visit.id,
      referenceCode: visit.referenceCode,
      status: visit.status,
      visitorName: visit.visitor.fullName,
      company: visit.visitor.company,
      purpose: visit.purpose,
      hostStaff: visit.hostStaff?.fullName,
      hostDepartment: visit.hostStaff?.department?.name,
      createdAt: visit.createdAt,
      approvedAt: visit.approvedAt,
      checkedInAt: visit.checkedInAt,
      checkedOutAt: visit.checkedOutAt,
      rejectionReason: visit.rejectionReason,
      hasFeedback: !!visit.feedback,
      feedbackSubmittedAt: visit.feedbackSubmittedAt,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}
