import { useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { Bell, Menu, LogOut } from "lucide-react";
import { t } from "../../lib/i18n";

type TopbarProps = {
  studentName: string;
  initials: string;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  overBanner?: boolean;
};

export function Topbar({
  studentName,
  initials,
  isMenuOpen,
  onMenuToggle,
  overBanner = false,
}: TopbarProps) {
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function handleLogout() {
    setBusy(true);
    setError(false);
    try {
      await logout();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  const glassStyle = overBanner
    ? "border border-white/40 bg-white/60 shadow-[0_1px_4px_rgb(15_23_42/0.06)] backdrop-blur-md"
    : "";

  return (
    <header
      className={`relative ${overBanner ? "bg-transparent" : "bg-slate-50"}`}
    >
      <div className="flex h-14 items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <button
          type="button"
          aria-label={t("dashboard.menu")}
          aria-expanded={isMenuOpen}
          aria-controls="main-sidebar"
          onClick={onMenuToggle}
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 lg:hidden ${overBanner ? "bg-white/90 shadow-sm backdrop-blur-sm" : ""}`}
        >
          <Menu size={18} />
        </button>

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label={t("dashboard.notifications")}
            className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${glassStyle}`}
          >
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-400 ring-2 ring-white/70" />
          </button>

          <div
            className={`flex h-10 min-w-0 items-center gap-2 rounded-full px-1 sm:pr-3 ${glassStyle}`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-950 text-xs font-semibold text-white">
              {user
                ? user.fullName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                : initials}
            </div>
            <div className="hidden min-w-0 text-left sm:block sm:max-w-48">
              <div className="truncate text-[13px] font-semibold leading-4 text-slate-900">
                {user?.fullName ?? studentName}
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleLogout()}
            aria-label={t(busy ? "auth.loggingOut" : "auth.logout")}
            title={t("auth.logout")}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sky-950 hover:bg-sky-100 disabled:opacity-50 ${glassStyle}`}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="px-4 py-2 text-sm text-red-700">
          {t("auth.logoutError")}
        </p>
      )}
    </header>
  );
}
