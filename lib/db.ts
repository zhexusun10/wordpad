import { env } from "@/lib/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(env.databaseUrl, {
  max: 1,
});

export const db = drizzle(client);

