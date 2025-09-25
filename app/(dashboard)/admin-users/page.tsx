import AdminUsersClient from "./AdminUsersClient";
import { requireSystemAdmin } from "@/lib/auth";

export default async function AdminUsersPage() {
  const session = await requireSystemAdmin();
  return <AdminUsersClient currentUserId={session.id} />;
}

