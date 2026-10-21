import { useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { t } from "../../lib/i18n";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppLayoutProps = {
  children: ReactNode;
  studentName?: string;
  initials?: string;
};

export function AppLayout({
  children,
  studentName = t("student.role"),
  initials = "E",
}: AppLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();
  const hidesAdminBanner =
    /^\/admin\/cycles\/\d+(?:\/|$)/.test(pathname) ||
    /^\/admin\/payments\/\d+\/manage(?:\/|$)/.test(pathname);
  const showAdminBanner = user?.role === "ADMIN" && !hidesAdminBanner;

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        <main className="min-w-0 flex-1 bg-slate-50">
          <div
            className={
              showAdminBanner
                ? "relative isolate h-[clamp(140px,32vw,220px)] overflow-hidden rounded-b-2xl bg-sky-100 lg:h-[280px] xl:h-[300px]"
                : undefined
            }
          >
            {showAdminBanner && (
              <>
                <img
                  src="/images/banner-aristoteles.png"
                  alt={t("dashboard.bannerAlt")}
                  width={1897}
                  height={717}
                  className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-sky-950/20 to-transparent"
                />
              </>
            )}
            <Topbar
              studentName={studentName}
              initials={initials}
              isMenuOpen={isMenuOpen}
              onMenuToggle={() => setIsMenuOpen((current) => !current)}
              overBanner={showAdminBanner}
            />
          </div>
          <div
            className={`w-full px-4 pb-10 sm:px-6 lg:px-8 ${showAdminBanner ? "pt-6" : "pt-3"}`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
