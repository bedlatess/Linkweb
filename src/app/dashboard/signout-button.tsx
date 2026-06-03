"use client";

/**
 * Sign-Out Button — Client Component
 *
 * Uses next-auth/react's signOut() to clear the session
 * and redirect to the sign-in page.
 */

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/auth/signin" })}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-2.5 text-sm font-medium text-red-300 backdrop-blur-sm transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/[0.1] hover:text-red-200"
    >
      <LogOut className="h-4 w-4" />
      退出登录
    </button>
  );
}