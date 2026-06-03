"use client";

/**
 * Dashboard Sidebar — Client Component
 *
 * Responsive sidebar with navigation links and user info.
 * Uses signOut() from next-auth/react for the logout button.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Link2,
  Palette,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  User,
  BarChart3,
} from "lucide-react";

const navItems = [
  {
    href: "/dashboard/links",
    label: "链接管理",
    icon: Link2,
  },
  {
    href: "/dashboard/appearance",
    label: "外观设置",
    icon: Palette,
  },
  {
    href: "/dashboard/analytics",
    label: "数据分析",
    icon: BarChart3,
  },
  {
    href: "/dashboard/settings",
    label: "账号中心",
    icon: Settings,
  },
];

interface SidebarProps {
  userName: string;
  userEmail: string;
  userImage?: string | null;
}

export function Sidebar({ userName, userEmail, userImage }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Mobile overlay
  const sidebarContent = (
    <div
      className={`flex h-full flex-col border-r border-white/[0.06] bg-white/[0.02] backdrop-blur-xl transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Header / Logo */}
      <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Link2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">LinkWeb</span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Link2 className="h-4 w-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white/60 lg:block"
          title={collapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          <ChevronLeft
            className={`h-4 w-4 transition-transform duration-300 ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-indigo-500/15 text-indigo-300 shadow-[inset_0_0_0_1px] shadow-indigo-500/20"
                  : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/[0.06] p-3">
        <div
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {userImage ? (
            <img
              src={userImage}
              alt=""
              className="h-8 w-8 flex-shrink-0 rounded-full ring-1 ring-white/10"
            />
          ) : (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
              <User className="h-4 w-4 text-white/40" />
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white/80">
                {userName}
              </p>
              <p className="truncate text-[10px] text-white/30">
                {maskEmail(userEmail)}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className={`mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/40 transition-all duration-200 hover:bg-red-500/[0.08] hover:text-red-300 ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "退出登录" : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>退出登录</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-white/10 bg-white/[0.03] p-2 backdrop-blur-xl lg:hidden"
      >
        <Menu className="h-5 w-5 text-white/70" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute -right-10 top-4 rounded-lg border border-white/10 bg-white/[0.03] p-2 backdrop-blur-xl"
            >
              <X className="h-5 w-5 text-white/70" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">{sidebarContent}</aside>
    </>
  );
}

function maskEmail(email: string): string {
  const atIndex = email.lastIndexOf("@");
  if (atIndex <= 0) return email;
  return email.slice(0, 3) + "***" + email.slice(atIndex);
}