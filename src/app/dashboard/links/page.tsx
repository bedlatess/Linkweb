import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LinksClient } from "./links-client";

/**
 * Links Management Page — Server Component
 *
 * Fetches initial links data from the database and passes it
 * to the client component for interactive management.
 */

export default async function LinksPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const links = await prisma.link.findMany({
    where: { userId: session.user.id },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          链接管理
        </h1>
        <p className="mt-1 text-sm text-white/50">
          添加、编辑、排序你的链接，右侧实时预览最终效果
        </p>
      </div>

      <LinksClient initialLinks={links} />
    </div>
  );
}