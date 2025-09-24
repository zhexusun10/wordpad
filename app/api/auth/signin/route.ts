import { NextResponse } from "next/server";

import { signIn } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    await signIn(email, password);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "登录失败" },
      { status: 400 }
    );
  }
}

