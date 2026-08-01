import { NextRequest } from "next/server";
import { apiSuccess, apiError, rateLimit } from "@/lib/api-utils";

// POST /api/upload - File upload for ID documents (FR-03, FR-04)
// Stores file as base64 data URL in the database (works on Vercel serverless)
// Max 5MB (Vercel serverless body limit)
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB (Vercel serverless limit)

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit("upload", 20, 60_000);
    if (!rl.allowed) {
      return apiError("Terlalu banyak muat naik. Sila cuba sebentar lagi.", 429);
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError("Tiada fail diterima.");
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      return apiError(
        `Format fail tidak disokong: ${file.type}. Hanya JPG, PNG, atau PDF dibenarkan.`
      );
    }

    if (file.size > MAX_SIZE) {
      return apiError(`Saiz fail melebihi had 5MB. Saiz semasa: ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
    }

    // Convert to base64 data URL
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Generate safe filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const safeExt = ["jpg", "jpeg", "png", "pdf"].includes(ext) ? ext : "bin";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;

    return apiSuccess({
      filePath: dataUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    }, "Fail berjaya dimuat naik.");
  } catch (error) {
    console.error("Upload error:", error);
    return apiError("Ralat semasa memuat naik fail: " + (error as Error).message, 500);
  }
}
