import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const mockAdmins = [
  {
    id: "1",
    name: "超级管理员",
    email: "admin@example.com",
    role: "系统管理员",
  },
];

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">管理员管理</h2>
        <p className="text-muted-foreground">
          管理拥有后台访问权限的管理员账号。
        </p>
      </div>
      <div className="grid gap-4">
        {mockAdmins.map((admin) => (
          <Card key={admin.id}>
            <CardHeader>
              <CardTitle>{admin.name}</CardTitle>
              <CardDescription>{admin.role}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              邮箱：{admin.email}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

