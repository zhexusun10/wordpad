"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type UserSession = {
  email: string;
};

const SESSION_KEY = "session";

// 假登录阶段：不做真实校验，仅要求非空输入

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_KEY)?.value;
  if (!value) return null;
  try {
    return JSON.parse(value) as UserSession;
  } catch (error) {
    console.error("Failed to parse session", error);
    return null;
  }
}

export async function requireSession(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    redirect("/signin");
  }
  return session;
}

export async function signIn(email: string, password: string) {
  if (!email || !password) {
    throw new Error("邮箱和密码不能为空");
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_KEY, JSON.stringify({ email }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function signUp(
  _name: string,
  email: string,
  password: string,
  confirmPassword: string
) {
  if (!email) throw new Error("邮箱不能为空");
  if (!password) throw new Error("密码不能为空");
  if (password !== confirmPassword) throw new Error("两次输入的密码不一致");
  await signIn(email, password);
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_KEY);
}

