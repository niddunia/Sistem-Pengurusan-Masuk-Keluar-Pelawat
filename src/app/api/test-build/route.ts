import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Build is working",
    hasSupabaseUrl: typeof process.env.SUPABASE_URL,
    time: new Date().toISOString(),
  });
}
