import { NextResponse } from "next/server";

import { hasAnyAdmin, signIn } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const exists = await hasAnyAdmin();
    if (!exists) {
      return NextResponse.json(
        { success: false, message: "尚未初始化系统管理员，请先注册" },
        { status: 400 }
      );
    }
    await signIn(email, password);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "登录失败" },
      { status: 400 }
    );
  }
}

