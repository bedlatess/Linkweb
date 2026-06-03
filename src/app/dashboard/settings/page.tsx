import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./settings-client";

/**
 * Account Settings Page — Server Component
 *
 * Fetches user profile + custom domain and passes to client.
 */
export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      username: true,
      customDomain: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          账号中心
        </h1>
        <p className="mt-1 text-sm text-white/50">
          管理你的账户信息、自定义域名和安全设置
        </p>
      </div>

      <SettingsClient
        userName={user?.name ?? "未设置"}
        userEmail={user?.email ?? ""}
        username={user?.username ?? ""}
        initialDomain={user?.customDomain ?? null}
      />
    </div>
  );
}