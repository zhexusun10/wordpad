import { env } from "@/lib/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// 构建连接字符串：
// - 本地 (localhost/127.0.0.1) 不强制 SSL
// - 远程（如 Supabase/Neon）若未携带 sslmode，则追加 sslmode=require
let connectionUrl = env.databaseUrl;
try {
  const url = new URL(env.databaseUrl);
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (!isLocal) {
    if (!url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "require");
    }
  }
  connectionUrl = url.toString();
} catch {
  // 如果解析失败，保留原始 URL
}

const client = postgres(connectionUrl, {
  max: 1,
  idle_timeout: 20,
});

export const db = drizzle(client);

