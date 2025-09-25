"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, count, eq, gt } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { adminSessions, adminUsers } from "@/db/schema";

export type UserSession = {
  id: number;
  email: string;
  name: string;
  role: "SYSTEM" | "ADMIN";
};

const SESSION_COOKIE = "admin_session";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 天

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

export async function hasAnyAdmin(): Promise<boolean> {
  const [{ value }] = await db.select({ value: count() }).from(adminUsers);
  return value > 0;
}

async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

async function createSession(userId: number) {
  const token = randomBytes(48).toString("base64url");
  const expiresAt = addSeconds(new Date(), SESSION_TTL_SECONDS);
  await db.insert(adminSessions).values({ userId, token, expiresAt });
  await setSessionCookie(token);
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const now = new Date();
  let rows: Array<UserSession> = [];
  try {
    rows = await db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
      })
      .from(adminSessions)
      .innerJoin(adminUsers, eq(adminUsers.id, adminSessions.userId))
      .where(and(eq(adminSessions.token, token), gt(adminSessions.expiresAt, now)))
      .limit(1);
  } catch (err) {
    // 数据库不可达或查询失败时，返回 null（RSC 中不修改 Cookie）
    return null;
  }

  const row = rows[0];
  if (!row) {
    // 失效或不存在，返回 null（RSC 中不修改 Cookie）
    return null;
  }
  return row;
}

export async function requireSession(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    redirect("/signin");
  }
  return session;
}

export async function requireSystemAdmin(): Promise<UserSession> {
  const session = await requireSession();
  if (session.role !== "SYSTEM") {
    redirect("/books");
  }
  return session;
}

export async function signIn(email: string, password: string) {
  if (!email || !password) {
    throw new Error("邮箱和密码不能为空");
  }

  const users = await db
    .select({ id: adminUsers.id, email: adminUsers.email, name: adminUsers.name, role: adminUsers.role, passwordHash: adminUsers.passwordHash })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);
  const user = users[0];
  if (!user) {
    throw new Error("账号或密码错误");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new Error("账号或密码错误");
  }

  await createSession(user.id);
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  confirmPassword: string
) {
  if (!name) throw new Error("姓名不能为空");
  if (!email) throw new Error("邮箱不能为空");
  if (!password) throw new Error("密码不能为空");
  if (password !== confirmPassword) throw new Error("两次输入的密码不一致");

  const exists = await hasAnyAdmin();
  if (exists) {
    throw new Error("已存在管理员，请前往登录");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const inserted = await db
    .insert(adminUsers)
    .values({ name, email, passwordHash, role: "SYSTEM" })
    .returning({ id: adminUsers.id });

  const user = inserted[0];
  await createSession(user.id);
}

export async function signOut() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(adminSessions).where(eq(adminSessions.token, token));
  }
  await clearSessionCookie();
}


