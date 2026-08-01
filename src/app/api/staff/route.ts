import { NextRequest } from "next/server";
import { db } from "@/lib/supabase-db";
import { apiSuccess, apiError, requireRole } from "@/lib/api-utils";

// GET /api/staff - List active staff for visitor dropdown (FR-02)
export async function GET(_req: NextRequest) {
  try {
    const staff = await db.profile.findMany({
      where: { role: "staff", isActive: true },
      select: {
        id: true,
        fullName: true,
        email: true,
        department: { select: { id: true, name: true } },
      },
      orderBy: [{ department: { name: "asc" } }, { fullName: "asc" }],
    });

    return apiSuccess(staff);
  } catch (error) {
    console.error("List staff error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}

// POST /api/staff - Admin creates walk-in registration on behalf of visitor (handled via visits/register with registeredById)
