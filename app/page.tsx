import { redirect } from "next/navigation";

import { getSession, hasAnyAdmin } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect("/books");
  }
  const exists = await hasAnyAdmin();
  redirect(exists ? "/signin" : "/signup");
}
