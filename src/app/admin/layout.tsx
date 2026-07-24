import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { auth } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/lib/adminAuth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (email !== ADMIN_EMAIL) {
    redirect("/");
  }

  return (
    <div className="admin-app">
      <AdminNav />
      <div className="admin-app__body">{children}</div>
    </div>
  );
}
