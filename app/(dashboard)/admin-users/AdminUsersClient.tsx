"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Edit, User } from "lucide-react";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: "SYSTEM" | "ADMIN";
};

export default function AdminUsersClient({ currentUserId }: { currentUserId: number }) {
  const router = useRouter();
  const [list, setList] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-users", { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json()).message || "加载失败");
      const data = await res.json();
      setList(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const role = String(formData.get("role") || "ADMIN");
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin-users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role }),
        });
        if (!res.ok) throw new Error((await res.json()).message || "创建失败");
        await refresh();
        form.reset();
        setCreateOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "创建失败");
      }
    });
  };

  const onUpdateRole = async (id: number, role: "SYSTEM" | "ADMIN") => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin-users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });
        if (!res.ok) throw new Error((await res.json()).message || "更新失败");
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "更新失败");
      }
    });
  };

  const onEdit = (user: AdminUser) => {
    setEditTarget(user);
    setEditOpen(true);
  };

  const onEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const role = String(formData.get("role") || ""); // 可能为空，表示不改
    setError(null);
    startTransition(async () => {
      try {
        const payload: Record<string, string> = {};
        if (name && name !== editTarget.name) payload.name = name;
        if (email && email !== editTarget.email) payload.email = email;
        if (role && role !== editTarget.role) payload.role = role;
        if (Object.keys(payload).length === 0) {
          setEditOpen(false);
          return;
        }
        const res = await fetch(`/api/admin-users/${editTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).message || "更新失败");
        await refresh();
        setEditOpen(false);
        setEditTarget(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "更新失败");
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">管理员管理</h2>
          <p className="text-muted-foreground">系统管理员可以新建、编辑与调整管理员角色。</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-neutral-900 hover:bg-neutral-800 text-white">
              <Plus className="w-4 h-4 mr-2" />
              新建管理员
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>新建管理员</DialogTitle>
              <DialogDescription>
                创建一个新的管理员账户。请填写以下信息。
              </DialogDescription>
            </DialogHeader>
            <form id="create-form" onSubmit={onCreate} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">姓名</Label>
                <Input id="name" name="name" required placeholder="张三" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">邮箱</Label>
                <Input id="email" name="email" type="email" required placeholder="admin@example.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">初始密码</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">角色</Label>
                <select id="role" name="role" className="h-9 w-full rounded-md border border-neutral-300 px-3">
                  <option value="ADMIN">普通管理员</option>
                  <option value="SYSTEM">系统管理员</option>
                </select>
              </div>
            </form>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                取消
              </Button>
              <Button type="submit" form="create-form" disabled={isPending} className="bg-neutral-900 hover:bg-neutral-800">
                {isPending ? "提交中..." : "创建"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">加载中...</p>
        ) : (
          list.map((admin) => (
            <Card key={admin.id} className="border-neutral-200">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-neutral-100 text-neutral-700">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{admin.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={admin.role === "SYSTEM" ? "default" : "secondary"} className="text-xs">
                        {admin.role === "SYSTEM" ? "系统管理员" : "普通管理员"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-600">{admin.email}</p>
                  <div className="flex space-x-2">
                    <Dialog open={editOpen && editTarget?.id === admin.id} onOpenChange={(open) => {
                      if (!open) {
                        setEditOpen(false);
                        setEditTarget(null);
                      } else {
                        setEditTarget(admin);
                        setEditOpen(true);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="border-neutral-300">
                          <Edit className="w-4 h-4 mr-1" />
                          编辑
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>编辑管理员</DialogTitle>
                          <DialogDescription>
                            修改管理员信息。
                          </DialogDescription>
                        </DialogHeader>
                        <form id="edit-form" onSubmit={onEditSubmit} className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edit-name">姓名</Label>
                            <Input id="edit-name" name="name" defaultValue={editTarget?.name} required />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-email">邮箱</Label>
                            <Input id="edit-email" name="email" type="email" defaultValue={editTarget?.email} required />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-role">角色</Label>
                            <select
                              id="edit-role"
                              name="role"
                              defaultValue={editTarget?.role}
                              className="h-9 w-full rounded-md border border-neutral-300 px-3"
                              disabled={editTarget?.id === currentUserId}
                            >
                              <option value="ADMIN">普通管理员</option>
                              <option value="SYSTEM">系统管理员</option>
                            </select>
                          </div>
                        </form>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => {
                            setEditOpen(false);
                            setEditTarget(null);
                          }}>
                            取消
                          </Button>
                          <Button type="submit" form="edit-form" disabled={isPending} className="bg-neutral-900 hover:bg-neutral-800">
                            {isPending ? "保存中..." : "保存"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    {/* 移除设为普通/系统管理员按钮 */}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

    </div>
  );
}


