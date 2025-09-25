import { pgTable, serial, text, varchar, timestamp, integer, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// 角色枚举：SYSTEM 系统管理员，ADMIN 普通管理员
export const adminRole = pgEnum("admin_role", ["SYSTEM", "ADMIN"]);

export const adminUsers = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: adminRole("role").notNull().default("ADMIN"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailUnique: uniqueIndex("admin_users_email_key").on(t.email),
  })
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
    // 随机生成的会话 token（例如 64~128 字节随机字符串）
    token: varchar("token", { length: 255 }).notNull(),
    // 过期时间（7天）
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tokenUnique: uniqueIndex("admin_sessions_token_key").on(t.token),
  })
);

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  sessions: many(adminSessions),
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  user: one(adminUsers, {
    fields: [adminSessions.userId],
    references: [adminUsers.id],
  }),
}));


