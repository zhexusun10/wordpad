import { NextResponse } from "next/server";

import { signUp } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password, confirmPassword } = await request.json();
    await signUp(name, email, password, confirmPassword);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "注册失败" },
      { status: 400 }
    );
  }
}

