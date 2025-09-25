import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { genSaltSync, hashSync } from 'bcrypt-ts';
import * as schema from './db/schema';
import { users } from './db/schema';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// 检查环境变量是否存在
if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set. Please create a .env.local file with your database URL.');
}

// 构建数据库连接字符串，处理 SSL 配置
const dbUrl = process.env.POSTGRES_URL.includes('?') 
  ? process.env.POSTGRES_URL 
  : `${process.env.POSTGRES_URL}?sslmode=require`;

const client = postgres(dbUrl, {
  prepare: false,
});

export const db = drizzle(client, { schema });

export async function getUser(email: string) {
  return db.select().from(users).where(eq(users.email, email));
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  return db.insert(users).values({ email, passwordHash: hash }).returning();
}
