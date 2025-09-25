import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { adminUsers } from "@/db/schema";
import { requireSystemAdmin } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const current = await requireSystemAdmin();
  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ message: "参数不合法" }, { status: 400 });
  }
  const body = await request.json();
  const role = body?.role as string | undefined;
  const name = (body?.name as string | undefined)?.trim();
  const email = (body?.email as string | undefined)?.trim();

  if (!role && !name && !email) {
    return NextResponse.json({ message: "缺少更新字段" }, { status: 400 });
  }

  // 仅当尝试修改角色时阻止自改状态
  if (role && current.id === id) {
    return NextResponse.json({ message: "不能修改自己的状态" }, { status: 400 });
  }

  if (role && role !== "SYSTEM" && role !== "ADMIN") {
    return NextResponse.json({ message: "角色不合法" }, { status: 400 });
  }

  // 边界：禁止将最后一位系统管理员降级
  if (role === "ADMIN") {
    const current = (await db
      .select({ id: adminUsers.id, role: adminUsers.role })
      .from(adminUsers)
      .where(eq(adminUsers.id, id))
      .limit(1))[0];
    if (!current) {
      return NextResponse.json({ message: "用户不存在" }, { status: 404 });
    }
    if (current.role === "SYSTEM") {
      const [{ value: sysCount }] = await db
        .select({ value: count() })
        .from(adminUsers)
        .where(eq(adminUsers.role, "SYSTEM" as any));
      if (sysCount <= 1) {
        return NextResponse.json({ message: "至少保留一位系统管理员" }, { status: 400 });
      }
    }
  }

  const updateSet: Record<string, any> = {};
  if (role) updateSet.role = role as any;
  if (name) updateSet.name = name;
  if (email) updateSet.email = email;

  try {
    await db.update(adminUsers).set(updateSet as any).where(eq(adminUsers.id, id));
  } catch (e: any) {
    if (e?.code === "23505") {
      return NextResponse.json({ message: "邮箱已存在" }, { status: 400 });
    }
    return NextResponse.json({ message: "更新失败" }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}


