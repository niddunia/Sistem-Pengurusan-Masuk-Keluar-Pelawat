import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers } from "next/headers";

export interface AuditParams {
  action: string;
  visitId?: string;
  details?: Record<string, unknown>;
  actorRole?: string;
  actorId?: string;
}

// Server-side audit logging - records to audit_logs table (immutable)
export async function logAudit({
  action,
  visitId,
  details = {},
  actorRole,
  actorId,
}: AuditParams) {
  try {
    const session = await getServerSession(authOptions);
    const h = await headers();

    const finalActorId = actorId || session?.user?.id || null;
    const finalActorRole =
      actorRole || session?.user?.role || (finalActorId ? "system" : "visitor");

    await db.auditLog.create({
      data: {
        actorId: finalActorId,
        actorRole: finalActorRole,
        action,
        visitId: visitId || null,
        details: JSON.stringify(details),
        ipAddress: h.get("x-forwarded-for") || h.get("x-real-ip") || "unknown",
        userAgent: h.get("user-agent") || "unknown",
      },
    });
  } catch (error) {
    console.error("Failed to log audit:", error);
  }
}

// Reference code generator: VMS-YYYYMMDD-XXXX
export function generateReferenceCode(): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `VMS-${dateStr}-${random}`;
}

// Standard API response helpers
export function apiSuccess<T>(data: T, message?: string) {
  return Response.json({ success: true, data, message });
}

export function apiError(message: string, status = 400, code?: string) {
  return Response.json(
    { success: false, error: message, code },
    { status }
  );
}

// Rate limiting (in-memory per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetIn: entry.resetTime - now,
  };
}

// Input sanitization
export function sanitizeString(input: string, maxLength = 1000): string {
  return input.slice(0, maxLength).replace(/<[^>]*>/g, "").trim();
}

// Validate email
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate Malaysian phone
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, "");
  return /^(\+?6?01)[0-46-9]-?[0-9]{7,8}$/.test(cleaned) || /^(\+?6?0)[0-9]{8,10}$/.test(cleaned);
}

// Check if user has required role
export async function requireRole(...roles: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { ok: false as const, error: "Unauthorized", status: 401 };
  }
  if (!roles.includes(session.user.role)) {
    return { ok: false as const, error: "Forbidden", status: 403 };
  }
  return { ok: true as const, session };
}
