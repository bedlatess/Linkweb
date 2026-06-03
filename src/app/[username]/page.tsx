import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { PublicLinkPage } from "./public-link-page";

/**
 * Public Visitor Link Page — SSR
 *
 * Route: /[username]
 * Fetches the user's profile, visible links, and theme config.
 * Renders the fully-themed link aggregation page.
 *
 * Reserved usernames (system routes) return 404.
 */

// Usernames that conflict with app routes
const RESERVED = new Set([
  "dashboard",
  "auth",
  "api",
  "_next",
  "favicon.ico",
  "public",
]);

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: { name: true, bio: true },
  });

  if (!user) return { title: "404 — Not Found" };

  return {
    title: `${user.name ?? username} — LinkWeb`,
    description: user.bio ?? `${user.name ?? username}的个人链接聚合页`,
    openGraph: {
      title: `${user.name ?? username} — LinkWeb`,
      description: user.bio ?? undefined,
      type: "website",
    },
  };
}

export default async function PublicPage({ params }: Props) {
  const { username } = await params;

  // Block reserved usernames
  if (RESERVED.has(username.toLowerCase())) {
    notFound();
  }

  // Fetch user + links + theme in a single round-trip using a transaction
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      links: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
      },
      themeConfig: true,
    },
  });

  if (!user) {
    notFound();
  }

  const theme = user.themeConfig ?? {
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
  };

  return (
    <PublicLinkPage
      username={user.username ?? username}
      displayName={user.name ?? username}
      bio={user.bio}
      avatarUrl={user.image}
      links={user.links.map((l) => ({
        id: l.id,
        title: l.title,
        url: l.url,
        iconName: l.iconName,
      }))}
      theme={{
        bgType: theme.bgType,
        bgValue: theme.bgValue,
        bgBlur: theme.bgBlur,
        buttonStyle: theme.buttonStyle,
        fontFamily: theme.fontFamily,
        tipEnabled: theme.tipEnabled,
        tipTitle: theme.tipTitle,
        paypalEmail: theme.paypalEmail,
        customTipUrl: theme.customTipUrl,
        cryptoAddress: theme.cryptoAddress,
      }}
    />
  );
}