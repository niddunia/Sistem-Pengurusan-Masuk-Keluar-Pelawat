import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, sanitizeString } from "@/lib/api-utils";

// GET /api/departments - List all departments (public, for dropdowns)
export async function GET(_req: NextRequest) {
  try {
    const departments = await db.department.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    return apiSuccess(departments);
  } catch (error) {
    console.error("List departments error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}
