import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "./sidebar";

/**
 * Dashboard Layout — Protected Shell
 *
 * Server Component: verifies auth, renders sidebar + content area.
 * All /dashboard/* pages inherit this layout.
 */

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      {/* Sidebar */}
      <Sidebar
        userName={session.user.name ?? "用户"}
        userEmail={session.user.email ?? ""}
        userImage={session.user.image}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}