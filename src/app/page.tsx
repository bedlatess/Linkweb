import Link from "next/link";
import { Link2, ArrowRight, GitBranch } from "lucide-react";

/**
 * LinkWeb Landing Page
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 px-4 text-center">
      {/* Animated orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] animate-[pulse_8s_ease-in-out_infinite] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] animate-[pulse_10s_ease-in-out_infinite] rounded-full bg-purple-500/15 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-lg">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/25">
          <Link2 className="h-8 w-8 text-white" />
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-white">
          LinkWeb
        </h1>
        <p className="mt-3 text-lg text-white/50">
          现代化 · 自托管 · 个人链接聚合平台
        </p>
        <p className="mt-2 text-sm text-white/30">
          开源、自由、你的数据你做主
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-400 hover:to-purple-500"
          >
            管理后台
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-medium text-white/60 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white/80"
          >
            <GitBranch className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}