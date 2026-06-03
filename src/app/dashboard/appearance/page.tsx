import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppearanceClient } from "./appearance-client";

/**
 * Appearance Settings Page — Server Component
 *
 * Fetches the current theme config from DB and passes it to the client.
 */
export default async function AppearancePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const config = await prisma.themeConfig.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          外观设置
        </h1>
        <p className="mt-1 text-sm text-white/50">
          选择预设主题或自定义你的 LinkWeb 页面外观
        </p>
      </div>

      <AppearanceClient
        initialConfig={
          config ?? {
            id: "",
            userId: session.user.id,
            bgType: "color",
            bgValue: "#0a0a0a",
            bgBlur: 0,
            buttonStyle: "rounded",
            fontFamily: null,
            customCSS: null,
            tipEnabled: false,
            tipTitle: null,
            paypalEmail: null,
            customTipUrl: null,
            cryptoAddress: null,
            updatedAt: new Date(),
          }
        }
      />
    </div>
  );
}