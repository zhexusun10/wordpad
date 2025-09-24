import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wordpad 管理后台 - 登录", // 默认标题
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-md space-y-8">{children}</div>
    </div>
  );
}

