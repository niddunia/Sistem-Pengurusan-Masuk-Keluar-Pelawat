import { NextRequest } from "next/server";
import { db } from "@/lib/supabase-db";
import { apiSuccess, apiError, requireRole, sanitizeString, logAudit } from "@/lib/api-utils";

// GET /api/admin/departments - List all departments
export async function GET(_req: NextRequest) {
  try {
    const session = await requireRole("admin");
    if (!session.ok) {
      return apiError(session.error, session.status);
    }

    const departments = await db.department.findMany({
      orderBy: { name: "asc" },
    });

    // Fetch profile counts per department separately
    const profiles = await db.profile.findMany({ select: { departmentId: true } });
    const profileCountMap = new Map<string, number>();
    for (const p of profiles) {
      if (p.departmentId) {
        profileCountMap.set(p.departmentId, (profileCountMap.get(p.departmentId) || 0) + 1);
      }
    }

    const result = departments.map(d => ({
      ...d,
      _count: { profiles: profileCountMap.get(d.id) || 0 },
    }));

    return apiSuccess(result);
  } catch (error) {
    console.error("List departments error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}

// POST /api/admin/departments - Create department (FR-28)
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole("admin");
    if (!session.ok) {
      return apiError(session.error, session.status);
    }

    const body = await req.json();
    const name = sanitizeString(body.name, 100);
    const description = body.description ? sanitizeString(body.description, 500) : null;

    if (!name || name.length < 2) {
      return apiError("Nama jabatan diperlukan (minimum 2 aksara).");
    }

    const existing = await db.department.findUnique({ where: { name } });
    if (existing) {
      return apiError("Nama jabatan telah wujud.", 409);
    }

    const dept = await db.department.create({
      data: { name, description },
    });

    await logAudit({
      action: "department_create",
      details: { name, id: dept.id },
    });

    return apiSuccess(dept, "Jabatan berjaya dicipta.");
  } catch (error) {
    console.error("Create department error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}

// DELETE /api/admin/departments?id=... - Delete department (if no users)
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireRole("admin");
    if (!session.ok) {
      return apiError(session.error, session.status);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("ID jabatan diperlukan.");
    }

    const count = await db.profile.count({ where: { departmentId: id } });
    if (count > 0) {
      return apiError(`Tidak boleh memadam. ${count} pengguna masih dalam jabatan ini.`, 400);
    }

    await db.department.delete({ where: { id } });

    await logAudit({
      action: "department_delete",
      details: { id },
    });

    return apiSuccess(null, "Jabatan berjaya dipadam.");
  } catch (error) {
    console.error("Delete department error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}
