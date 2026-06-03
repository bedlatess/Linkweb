"use client";

/**
 * Auth Error Content — Client Component
 *
 * Reads the error query param and displays the appropriate message.
 */

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

const errorMessages: Record<string, string> = {
  Configuration: "服务器配置错误，请联系管理员。",
  AccessDenied: "访问被拒绝。您没有权限执行此操作。",
  Verification: "验证失败。令牌可能已过期。",
  OAuthSignin: "OAuth 登录初始化失败，请重试。",
  OAuthCallback: "OAuth 回调处理失败，请重试。",
  OAuthCreateAccount: "无法创建 OAuth 关联账户。",
  EmailCreateAccount: "无法创建邮箱关联账户。",
  Callback: "回调处理过程中发生错误。",
  OAuthAccountNotLinked: "该邮箱已通过其他方式注册，请使用原登录方式。",
  EmailSignin: "邮件发送失败，请检查邮箱地址。",
  CredentialsSignin: "邮箱或密码错误，请重试。",
  SessionRequired: "请先登录后再访问此页面。",
  default: "身份验证过程中发生未知错误，请重试。",
};

export function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = errorMessages[error ?? "default"] ?? errorMessages.default;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <div className="w-full max-w-md px-4">
        <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-7 w-7 text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-white">认证错误</h1>
          <p className="mt-3 text-sm text-white/60">{message}</p>
          <Link
            href="/auth/signin"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-white/70 backdrop-blur-sm transition-colors hover:bg-white/[0.1] hover:text-white"
          >
            返回登录页面
          </Link>
        </div>
      </div>
    </div>
  );
}