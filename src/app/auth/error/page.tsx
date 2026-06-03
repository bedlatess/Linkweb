import { Suspense } from "react";
import { AuthErrorContent } from "./error-content";

/**
 * Auth Error Page — Wrapped in Suspense for useSearchParams()
 */
export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}