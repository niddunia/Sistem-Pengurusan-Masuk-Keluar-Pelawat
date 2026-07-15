import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  apiSuccess,
  apiError,
  logAudit,
  generateReferenceCode,
  rateLimit,
  sanitizeString,
  isValidEmail,
  isValidPhone,
} from "@/lib/api-utils";
import { broadcast } from "@/lib/realtime";

// POST /api/visits/register - Visitor self-registration (FR-01 to FR-05)
// Accepts multipart/form-data: visitor fields + optional document metadata
export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit("visitor-register", 10, 60_000);
    if (!rl.allowed) {
      return apiError("Terlalu banyak percubaan. Sila cuba lagi sebentar.", 429);
    }

    const body = await req.json();

    const fullName = sanitizeString(body.fullName, 200);
    const icPassportNo = sanitizeString(body.icPassportNo, 50);
    const phone = sanitizeString(body.phone, 30);
    const email = body.email ? sanitizeString(body.email, 200) : null;
    const company = body.company ? sanitizeString(body.company, 200) : null;
    const purpose = sanitizeString(body.purpose, 500);
    const hostStaffId = sanitizeString(body.hostStaffId, 100);
    const expectedVisitDate = body.expectedVisitDate;
    const pdpaConsent = body.pdpaConsent === true;
    const documents = Array.isArray(body.documents) ? body.documents : [];

    // Validation
    if (!fullName || fullName.length < 3) {
      return apiError("Nama penuh diperlukan (minimum 3 aksara).");
    }
    if (!icPassportNo || icPassportNo.length < 5) {
      return apiError("No. MyKad/Pasport diperlukan.");
    }
    if (!phone || !isValidPhone(phone)) {
      return apiError("No. telefon tidak sah.");
    }
    if (email && !isValidEmail(email)) {
      return apiError("Format e-mel tidak sah.");
    }
    if (!purpose || purpose.length < 5) {
      return apiError("Tujuan urusan diperlukan (minimum 5 aksara).");
    }
    if (!hostStaffId) {
      return apiError("Sila pilih staf/jabatan yang hendak ditemui.");
    }
    if (!expectedVisitDate) {
      return apiError("Tarikh lawatan diperlukan.");
    }
    if (!pdpaConsent) {
      return apiError("Kebenaran PDPA wajib ditandakan untuk mendaftar.", 403);
    }
    if (documents.length === 0) {
      return apiError("Sekurang-kurangnya satu (1) bukti pengenalan diri wajib dimuat naik.", 400);
    }

    // Verify host staff exists
    const hostStaff = await db.profile.findFirst({
      where: { id: hostStaffId, role: "staff", isActive: true },
    });
    if (!hostStaff) {
      return apiError("Staf tuan rumah tidak dijumpai atau tidak aktif.");
    }

    // Check or create visitor (lookup by ic/passport)
    let visitor = await db.visitor.findFirst({
      where: { icPassportNo },
    });

    if (!visitor) {
      visitor = await db.visitor.create({
        data: {
          fullName,
          icPassportNo,
          phone,
          email,
          company,
        },
      });
    } else {
      // Update existing visitor info
      visitor = await db.visitor.update({
        where: { id: visitor.id },
        data: {
          fullName,
          phone,
          email: email || visitor.email,
          company: company || visitor.company,
        },
      });
    }

    // Generate unique reference code
    let referenceCode = generateReferenceCode();
    let exists = await db.visit.findUnique({ where: { referenceCode } });
    while (exists) {
      referenceCode = generateReferenceCode();
      exists = await db.visit.findUnique({ where: { referenceCode } });
    }

    // Create visit
    const visit = await db.visit.create({
      data: {
        referenceCode,
        visitorId: visitor.id,
        purpose,
        hostStaffId,
        expectedVisitDate: new Date(expectedVisitDate),
        status: "pending_approval",
        pdpaConsent: true,
      },
      include: {
        visitor: true,
        hostStaff: { select: { id: true, fullName: true, email: true, department: { select: { name: true } } } },
      },
    });

    // Save documents (metadata - files already uploaded via /api/upload)
    for (const doc of documents) {
      await db.visitorDocument.create({
        data: {
          visitorId: visitor.id,
          visitId: visit.id,
          docType: sanitizeString(doc.docType || "mykad", 20),
          fileName: sanitizeString(doc.fileName, 200),
          filePath: sanitizeString(doc.filePath, 500),
          fileSize: Number(doc.fileSize) || 0,
          mimeType: sanitizeString(doc.mimeType, 100),
        },
      });
    }

    // Create notification to security
    await db.notification.create({
      data: {
        recipientType: "security",
        visitId: visit.id,
        channel: "in_app",
        title: "Permohonan Lawatan Baru",
        message: `${visitor.fullName} - ${purpose}`,
      },
    });

    await logAudit({
      action: "visit_create",
      visitId: visit.id,
      details: { referenceCode, visitorName: fullName, purpose },
      actorRole: "visitor",
    });

    // Realtime: notify all security clients of the new visit
    broadcast("new_visit", "security", { visit });

    return apiSuccess(
      { visit, referenceCode },
      "Permohonan berjaya dihantar. Sila catat kod rujukan anda."
    );
  } catch (error) {
    console.error("Register error:", error);
    return apiError("Ralat pelayan semasa pendaftaran.", 500);
  }
}
