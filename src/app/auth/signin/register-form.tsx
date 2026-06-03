"use client";

/**
 * Register Form — Client Component
 *
 * Fields: Email, Username, Password
 * Validates: username format (alphanumeric + underscore, 3-30 chars)
 * Submits to POST /api/auth/register
 * On success: calls onSuccess(email, password) for auto sign-in
 */

import { useState } from "react";
import { Loader2, Link2, ArrowLeft, Check } from "lucide-react";

// Username regex: letters, numbers, underscores, 3-30 chars
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

interface Props {
  onSwitchToSignIn: () => void;
  onSuccess: (email: string, password: string) => void;
}

export function RegisterForm({ onSwitchToSignIn, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Client-side username validation
  const usernameError = username.length > 0 && !USERNAME_REGEX.test(username)
    ? "只允许英文字母、数字和下划线，3-30 个字符"
    : "";

  const passwordError =
    confirmPassword.length > 0 && password !== confirmPassword
      ? "两次输入的密码不一致"
      : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (usernameError || passwordError) return;

    // Client-side validation
    if (!email.includes("@")) {
      setError("请提供有效的邮箱地址");
      return;
    }

    if (password.length < 6) {
      setError("密码长度至少为 6 个字符");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "注册失败，请重试");
        return;
      }

      // Registration successful — trigger auto sign-in
      onSuccess(email.trim(), password);
    } catch {
      setError("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/30 backdrop-blur-2xl">
      {/* Logo & Title */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
          <Link2 className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          创建账号
        </h1>
        <p className="mt-1.5 text-sm text-white/50">
          注册后即可拥有专属链接聚合页
        </p>
      </div>

      {/* ─── Register Form ─── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            邮箱地址
          </label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/20 backdrop-blur-sm transition-all duration-200 focus:border-indigo-500/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Username */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            用户名{" "}
            <span className="text-white/20">
              (公开页面地址: /{username || "yourname"})
            </span>
          </label>
          <input
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourname"
            className={`w-full rounded-xl border bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/20 backdrop-blur-sm transition-all duration-200 focus:bg-white/[0.06] focus:outline-none focus:ring-2 ${
              usernameError
                ? "border-red-500/30 focus:border-red-500/50 focus:ring-red-500/15"
                : "border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/20"
            }`}
          />
          {usernameError && (
            <p className="mt-1 text-xs text-red-400">{usernameError}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            密码 <span className="text-white/20">(至少 6 个字符)</span>
          </label>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/20 backdrop-blur-sm transition-all duration-200 focus:border-indigo-500/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            确认密码
          </label>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className={`w-full rounded-xl border bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/20 backdrop-blur-sm transition-all duration-200 focus:bg-white/[0.06] focus:outline-none focus:ring-2 ${
              passwordError
                ? "border-red-500/30 focus:border-red-500/50 focus:ring-red-500/15"
                : "border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/20"
            }`}
          />
          {passwordError && (
            <p className="mt-1 text-xs text-red-400">{passwordError}</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !!usernameError || !!passwordError}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-400 hover:to-purple-500 hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              注册中...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              注册
            </>
          )}
        </button>
      </form>

      {/* ─── Back to sign-in ─── */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="inline-flex items-center gap-1.5 text-xs text-white/30 transition-colors hover:text-indigo-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          已有账号？返回登录
        </button>
      </div>
    </div>
  );
}