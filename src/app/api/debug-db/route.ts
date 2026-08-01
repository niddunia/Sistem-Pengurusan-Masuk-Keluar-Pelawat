import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-db";
import bcrypt from "bcryptjs";

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    steps: [] as Array<{ step: string; success: boolean; message: string; data?: unknown }>,
  };

  // Step 1: Test database connection via REST API
  try {
    const userCount = await db.profile.count();
    results.steps.push({
      step: "1. Database Connection (REST API)",
      success: true,
      message: `Connected! Found ${userCount} users in database.`,
    });
  } catch (e) {
    results.steps.push({
      step: "1. Database Connection (REST API)",
      success: false,
      message: `FAILED: ${(e as Error).message}`,
    });
    return NextResponse.json(results, { status: 500 });
  }

  // Step 2: Find the test user
  try {
    const user = await db.profile.findUnique({
      where: { email: "faizal@pltbintulu.gov.my" },
    });
    if (!user) {
      results.steps.push({
        step: "2. Find User",
        success: false,
        message: "User faizal@pltbintulu.gov.my NOT FOUND in database!",
      });
    } else {
      results.steps.push({
        step: "2. Find User",
        success: true,
        message: `User found: ${user.fullName}, role: ${user.role}, active: ${user.isActive}`,
        data: { ...user, passwordHash: user.passwordHash?.slice(0, 10) + "..." },
      });

      // Step 3: Test password verification
      try {
        const valid = await bcrypt.compare("password123", user.passwordHash);
        results.steps.push({
          step: "3. Password Verification",
          success: valid,
          message: valid
            ? "Password 'password123' matches the hash ✅"
            : "Password 'password123' does NOT match ❌",
        });
      } catch (e) {
        results.steps.push({
          step: "3. Password Verification",
          success: false,
          message: `bcrypt error: ${(e as Error).message}`,
        });
      }
    }
  } catch (e) {
    results.steps.push({
      step: "2. Find User",
      success: false,
      message: `FAILED: ${(e as Error).message}`,
    });
  }

  // Step 4: Check environment
  results.steps.push({
    step: "4. Environment",
    success: true,
    message: `SUPABASE_URL: ${process.env.SUPABASE_URL || "(using default)"}`,
    data: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV,
    },
  });

  return NextResponse.json(results);
}
