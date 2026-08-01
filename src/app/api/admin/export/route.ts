import { NextRequest } from "next/server";
import { db } from "@/lib/supabase-db";
import { apiError, requireRole } from "@/lib/api-utils";

// GET /api/admin/export - Export visits as CSV (FR-31)
// Query: ?from=...&to=...&status=...
export async function GET(req: NextRequest) {
  try {
    const session = await requireRole("admin");
    if (!session.ok) {
      return apiError(session.error, session.status);
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const visits = await db.visit.findMany({
      where,
      include: {
        visitor: { select: { fullName: true, icPassportNo: true, phone: true, email: true, company: true } },
        hostStaff: { select: { fullName: true, department: { select: { name: true } } } },
        approvedBy: { select: { fullName: true } },
        feedback: { select: { rating: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    // Build CSV
    const headers = [
      "Reference Code",
      "Visitor Name",
      "IC/Passport",
      "Phone",
      "Email",
      "Company",
      "Purpose",
      "Host Staff",
      "Department",
      "Status",
      "Created At",
      "Approved At",
      "Checked In At",
      "Staff Verified At",
      "Staff Remarks",
      "Feedback Submitted At",
      "Rating",
      "Feedback Comments",
      "Checked Out At",
      "Exit Notes",
      "Rejection Reason",
    ];

    const escapeCsv = (val: unknown) => {
      const s = val == null ? "" : String(val);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows = visits.map((v) =>
      [
        v.referenceCode,
        v.visitor.fullName,
        v.visitor.icPassportNo,
        v.visitor.phone,
        v.visitor.email || "",
        v.visitor.company || "",
        v.purpose,
        v.hostStaff?.fullName || "",
        v.hostStaff?.department?.name || "",
        v.status,
        v.createdAt.toISOString(),
        v.approvedAt?.toISOString() || "",
        v.checkedInAt?.toISOString() || "",
        v.staffVerifiedAt?.toISOString() || "",
        v.staffRemarks || "",
        v.feedbackSubmittedAt?.toISOString() || "",
        v.feedback?.rating || "",
        v.feedback?.comments || "",
        v.checkedOutAt?.toISOString() || "",
        v.exitNotes || "",
        v.rejectionReason || "",
      ].map(escapeCsv).join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="vms-visits-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}
