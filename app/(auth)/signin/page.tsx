"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/signin", {
          method: "POST",
          body: JSON.stringify({ email, password }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "登录失败");
        }
        router.replace("/books");
      } catch (err) {
        setError(err instanceof Error ? err.message : "登录失败");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>管理员登录</CardTitle>
        <CardDescription>输入邮箱和密码登录管理后台。</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" name="email" type="email" required placeholder="admin@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input id="password" name="password" type="password" required placeholder="••••••••" />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
        <CardFooter className="flex-col items-stretch space-y-3">
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "登录中..." : "立即登录"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.push("/signup")}
          >
            注册管理员账号
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

