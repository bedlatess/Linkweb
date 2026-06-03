import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "./analytics-client";

/**
 * Analytics Dashboard — Server Component
 *
 * Passes the session to the client for API fetching.
 * Authentication enforced by proxy.ts.
 */
export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          数据分析
        </h1>
        <p className="mt-1 text-sm text-white/50">
          过去 7 天的链接访问数据概览
        </p>
      </div>

      <AnalyticsClient />
    </div>
  );
}