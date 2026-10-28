"use client";

/**
 * Vartistic portal root — single-page application.
 * Route surface: every view + filter lives in the query string of "/".
 * Flow: Preloader (animated logo, reduced-motion aware) → session fetch →
 * LoginView or AppShell. The session user is provided via context, derived
 * straight from the query cache (no setState-in-effect).
 */
import { Suspense } from "react";
import { Providers } from "@/components/vartistic/providers";
import { Preloader } from "@/components/vartistic/preloader";
import { LoginView } from "@/components/vartistic/login-view";
import { AppShell } from "@/components/vartistic/app-shell";
import { useSession } from "@/lib/client/hooks";
import { UserContext } from "@/lib/store/user-context";
import { useSearchParams } from "next/navigation";

function PortalInner() {
  const { data, isLoading, isError } = useSession();
  const user = data?.user ?? null;
  const ready = !isLoading;

  return (
    <UserContext.Provider value={user}>
      <Preloader done={ready} />
      {isError ? (
        <div className="grid min-h-screen place-items-center p-6 text-center" role="alert">
          <div>
            <p className="text-lg font-extrabold">The portal is unreachable</p>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              The API did not respond. Refresh to retry.
            </p>
            <button
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        </div>
      ) : ready && user ? (
        <AppShell />
      ) : ready ? (
        <LoginView />
      ) : (
        // Preloader covers this window; keep an empty themed canvas beneath it.
        <div className="min-h-screen bg-background" aria-hidden />
      )}
    </UserContext.Provider>
  );
}

export default function Page() {
  return (
    <Providers>
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <PortalInner />
      </Suspense>
    </Providers>
  );
}
