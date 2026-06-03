"use client";

/**
 * LinkWeb Sign-In Content — Client Component
 *
 * Glassmorphism design with:
 *   - Credentials login (email + password)
 *   - GitHub / Google OAuth buttons (activate with env vars)
 *   - Toggle to registration form
 *   - Redirect to /dashboard on success
 */

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Link2, UserPlus } from "lucide-react";
import { RegisterForm } from "./register-form";

/** Inline SVG icons for brands not available in lucide-react */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const error = searchParams.get("error");

  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setFormError("邮箱或密码错误，请重试。");
    } else {
      startTransition(() => {
        router.push(callbackUrl);
        router.refresh();
      });
    }
  }

  function handleOAuthSignIn(provider: "github" | "google") {
    signIn(provider, { callbackUrl });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      {/* ─── Animated background orbs ─── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] animate-[pulse_8s_ease-in-out_infinite] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] animate-[pulse_10s_ease-in-out_infinite] rounded-full bg-purple-500/15 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 animate-[pulse_12s_ease-in-out_infinite] rounded-full bg-cyan-500/10 blur-[80px]" />
      </div>

      {/* ─── Glassmorphism card ─── */}
      <div className="relative z-10 w-full max-w-md px-4">
        {mode === "register" ? (
          <RegisterForm
            onSwitchToSignIn={() => setMode("signin")}
            onSuccess={(email, password) => {
              // After registration, auto sign-in with the same credentials
              setEmail(email);
              setPassword(password);
              setMode("signin");
              // Trigger sign-in after a brief delay to let state settle
              setTimeout(() => {
                signIn("credentials", {
                  email,
                  password,
                  callbackUrl,
                });
              }, 300);
            }}
          />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/30 backdrop-blur-2xl">
            {/* Logo & Title */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                <Link2 className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                LinkWeb
              </h1>
              <p className="mt-1.5 text-sm text-white/50">登录到管理后台</p>
            </div>

            {/* ─── OAuth Buttons ─── */}
            <div className="mb-6 space-y-3">
              <button
                type="button"
                onClick={() => handleOAuthSignIn("github")}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-white/80 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              >
                <GitHubIcon className="h-5 w-5" />
                使用 GitHub 登录
              </button>

              <button
                type="button"
                onClick={() => handleOAuthSignIn("google")}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-white/80 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              >
                <GoogleIcon className="h-5 w-5" />
                使用 Google 登录
              </button>
            </div>

            {/* ─── Divider ─── */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/8" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-950/50 px-3 text-xs text-white/30 backdrop-blur-sm">
                  或使用账号密码登录
                </span>
              </div>
            </div>

            {/* ─── Credentials Form ─── */}
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-medium text-white/50"
                >
                  邮箱地址
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@linkweb.local"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/20 backdrop-blur-sm transition-all duration-200 focus:border-indigo-500/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-medium text-white/50"
                >
                  密码
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/20 backdrop-blur-sm transition-all duration-200 focus:border-indigo-500/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Error messages */}
              {(formError || error) && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                  {formError ||
                    (error === "CredentialsSignin"
                      ? "邮箱或密码错误，请重试。"
                      : "登录过程中发生错误，请重试。")}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-400 hover:to-purple-500 hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  "登录"
                )}
              </button>
            </form>

            {/* ─── Register toggle ─── */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMode("register")}
                className="inline-flex items-center gap-1.5 text-xs text-white/30 transition-colors hover:text-indigo-400"
              >
                <UserPlus className="h-3.5 w-3.5" />
                没有账号？立即注册
              </button>
            </div>

            {/* ─── Footer hint ─── */}
            <p className="mt-4 text-center text-xs text-white/20">
              测试账号：admin@linkweb.local / admin123
            </p>
          </div>
        )}
      </div>
    </div>
  );
}