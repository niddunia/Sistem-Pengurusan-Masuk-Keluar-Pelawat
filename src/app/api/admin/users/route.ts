import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  apiSuccess,
  apiError,
  requireRole,
  sanitizeString,
  isValidEmail,
  logAudit,
} from "@/lib/api-utils";
import bcrypt from "bcryptjs";

// GET /api/admin/users - List all users (FR-27)
export async function GET(_req: NextRequest) {
  try {
    const session = await requireRole("admin");
    if (!session.ok) {
      return apiError(session.error, session.status);
    }

    const users = await db.profile.findMany({
      include: {
        department: { select: { id: true, name: true } },
      },
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
    });

    // Strip password hash
    const safe = users.map(({ passwordHash, ...u }) => u);

    return apiSuccess(safe);
  } catch (error) {
    console.error("List users error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}

// POST /api/admin/users - Create user (FR-27)
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole("admin");
    if (!session.ok) {
      return apiError(session.error, session.status);
    }

    const body = await req.json();
    const email = sanitizeString(body.email, 200).toLowerCase();
    const fullName = sanitizeString(body.fullName, 200);
    const role = body.role;
    const phone = body.phone ? sanitizeString(body.phone, 30) : null;
    const departmentId = body.departmentId || null;
    const password = body.password;

    if (!email || !isValidEmail(email)) {
      return apiError("E-mel tidak sah.");
    }
    if (!fullName || fullName.length < 3) {
      return apiError("Nama penuh diperlukan.");
    }
    if (!["security", "staff", "admin"].includes(role)) {
      return apiError("Peranan tidak sah.");
    }
    if (!password || password.length < 8) {
      return apiError("Kata laluan minimum 8 aksara.");
    }

    const existing = await db.profile.findUnique({ where: { email } });
    if (existing) {
      return apiError("E-mel telah didaftarkan.", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await db.profile.create({
      data: {
        email,
        fullName,
        role,
        phone,
        departmentId,
        passwordHash,
        isActive: true,
      },
      include: { department: { select: { name: true } } },
    });

    await logAudit({
      action: "user_create",
      details: { email, fullName, role },
    });

    const { passwordHash: _, ...safe } = user;
    return apiSuccess(safe, "Pengguna berjaya dicipta.");
  } catch (error) {
    console.error("Create user error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}

// PATCH /api/admin/users - Update user (FR-27)
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRole("admin");
    if (!session.ok) {
      return apiError(session.error, session.status);
    }

    const body = await req.json();
    const { id, fullName, role, phone, departmentId, isActive, password } = body;

    if (!id) {
      return apiError("ID pengguna diperlukan.");
    }

    const update: Record<string, unknown> = {};
    if (fullName !== undefined) update.fullName = sanitizeString(fullName, 200);
    if (role !== undefined && ["security", "staff", "admin"].includes(role)) update.role = role;
    if (phone !== undefined) update.phone = phone ? sanitizeString(phone, 30) : null;
    if (departmentId !== undefined) update.departmentId = departmentId || null;
    if (isActive !== undefined) update.isActive = !!isActive;
    if (password) {
      if (password.length < 8) {
        return apiError("Kata laluan minimum 8 aksara.");
      }
      update.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await db.profile.update({
      where: { id },
      data: update,
      include: { department: { select: { name: true } } },
    });

    await logAudit({
      action: "user_update",
      details: { userId: id, updates: Object.keys(update) },
    });

    const { passwordHash: _, ...safe } = user;
    return apiSuccess(safe, "Pengguna berjaya dikemas kini.");
  } catch (error) {
    console.error("Update user error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}

// DELETE (soft-deactivate) /api/admin/users - PRD: no hard delete, use soft-delete (deactivate)
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireRole("admin");
    if (!session.ok) {
      return apiError(session.error, session.status);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("ID pengguna diperlukan.");
    }

    if (id === session.session.user.id) {
      return apiError("Anda tidak boleh menyahaktifkan akaun sendiri.", 400);
    }

    // Soft delete - just deactivate (PRD: tiada hard delete)
    await db.profile.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      action: "user_deactivate",
      details: { userId: id },
    });

    return apiSuccess(null, "Pengguna telah dinyahaktifkan (soft-delete).");
  } catch (error) {
    console.error("Deactivate user error:", error);
    return apiError("Ralat pelayan.", 500);
  }
}
