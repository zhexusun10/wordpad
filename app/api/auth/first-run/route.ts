import { NextResponse } from "next/server";

import { hasAnyAdmin } from "@/lib/auth";

export async function GET() {
  const exists = await hasAnyAdmin();
  return NextResponse.json({ exists });
}


