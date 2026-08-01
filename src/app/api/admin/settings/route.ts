import { NextRequest } from "next/server";
import { db } from "@/lib/supabase-db";
import { apiSuccess, apiError, requireRole, logAudit } from "@/lib/api-utils";

// GET /api/admin/settings - Get all system settings (FR-32)
export async function GET(_req: NextRequest) {
  try {
    const session = await requireRole("admin");
    if (!session.ok) {
      return apiError(session.error, session.status);
    }

    const settings = await db.systemSetting.findMany();
    const result: Record<string, unknown> = {};
    for (const s of settings) {
      try {
        result[s.key] = JSON.parse(s.value);
      } catch {
        result[s.key] = s.value;
      }
    }

    return apiSuccess(result);
  } catch (error) {
    console.error("Get settings error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}

// PUT /api/admin/settings - Update settings (FR-32)
export async function PUT(req: NextRequest) {
  try {
    const session = await requireRole("admin");
    if (!session.ok) {
      return apiError(session.error, session.status);
    }

    const body = await req.json();
    const updates = body.updates || body;

    const allowedKeys = [
      "staff_verification_sla_hours",
      "data_retention_months",
      "overstay_threshold_minutes",
      "max_upload_size_mb",
      "pdpa_notice_text",
      "organization_name",
      "organization_short",
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (!allowedKeys.includes(key)) continue;
      await db.systemSetting.upsert({
        where: { key },
        update: { value: JSON.stringify(value) },
        create: { key, value: JSON.stringify(value) },
      });
    }

    await logAudit({
      action: "settings_update",
      details: { keys: Object.keys(updates) },
    });

    return apiSuccess(null, "Tetapan berjaya dikemas kini.");
  } catch (error) {
    console.error("Update settings error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}
