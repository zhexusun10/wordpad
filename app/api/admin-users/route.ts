import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { adminUsers } from "@/db/schema";
import { requireSystemAdmin } from "@/lib/auth";

export async function GET() {
  await requireSystemAdmin();
  const items = await db
    .select({ id: adminUsers.id, name: adminUsers.name, email: adminUsers.email, role: adminUsers.role })
    .from(adminUsers)
    .orderBy(adminUsers.id);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const current = await requireSystemAdmin();
  const { name, email, password, role } = await request.json();
  if (!name || !email || !password) {
    return NextResponse.json({ message: "参数不完整" }, { status: 400 });
  }
  if (role !== "SYSTEM" && role !== "ADMIN") {
    return NextResponse.json({ message: "角色不合法" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const inserted = await db
      .insert(adminUsers)
      .values({ name, email, passwordHash, role })
      .returning({ id: adminUsers.id });
    return NextResponse.json({ id: inserted[0].id });
  } catch (e: any) {
    // 简单处理唯一键冲突
    if (e?.code === "23505") {
      return NextResponse.json({ message: "邮箱已存在" }, { status: 400 });
    }
    return NextResponse.json({ message: "创建失败" }, { status: 400 });
  }
}


