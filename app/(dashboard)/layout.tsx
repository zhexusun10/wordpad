import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { requireSession, signOut } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Wordpad 管理后台",
};

const navItems = [
  { href: "/books", label: "单词书管理" },
  { href: "/admin-users", label: "管理员管理" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  async function handleSignOut() {
    "use server";
    await signOut();
    redirect("/signin");
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="flex w-64 flex-col border-r bg-card">
        <div className="px-6 py-4">
          <h1 className="text-lg font-semibold">Wordpad 控制台</h1>
          <p className="text-sm text-muted-foreground">
            管理单词书与管理员账号
          </p>
        </div>
        <nav className="flex-1 space-y-1 px-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={handleSignOut} className="border-t px-4 py-4 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{session.email}</p>
              <p className="text-xs text-muted-foreground">管理员</p>
            </div>
            <Button type="submit" variant="ghost" size="icon" aria-label="退出登录">
              <span className="text-lg">⎋</span>
            </Button>
          </div>
        </form>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

