import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "注册已关闭，请联系管理员" }, { status: 405 });
}

