import { useAuth } from "../../auth/useAuth";
import { dashboardPath } from "../../auth/types";
import {
  Users,
  BookOpen,
  House,
  UserRound,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useState } from "react";

import { t } from "../../lib/i18n";

const studentNavItems = [
  { label: t("navigation.home"), icon: House, to: "/" },
  { label: t("navigation.courses"), icon: BookOpen, to: "/courses" },
  { label: t("navigation.tasks"), icon: ClipboardList, to: "/tasks" },
  { label: t("navigation.profile"), icon: UserRound, to: "/profile" },
];

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const navItems =
    user?.role === "STUDENT"
      ? studentNavItems
      : [
          {
            label: t("navigation.home"),
            icon: House,
            to: user ? dashboardPath(user.role) : "/login",
          },
          ...(user?.role === "ADMIN"
            ? [
                {
                  label: t("navigation.users"),
                  icon: Users,
                  to: "/admin/users",
                },
              ]
            : []),
          { label: t("navigation.profile"), icon: UserRound, to: "/profile" },
        ];
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleLabel = t(
    isCollapsed ? "navigation.expand" : "navigation.collapse",
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label={t("navigation.close")}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <aside
        id="main-sidebar"
        className={`
          fixed inset-y-0 left-0 z-50 flex h-dvh flex-col
          border-r border-slate-200 bg-white
          transition-[width,transform] duration-300 ease-in-out

          lg:sticky lg:top-0 lg:translate-x-0

          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "lg:w-[76px]" : "w-[280px] lg:w-[260px]"}
        `}
      >
        {/* Desktop collapse control */}
        <button
          type="button"
          aria-label={toggleLabel}
          title={toggleLabel}
          onClick={() => setIsCollapsed((current) => !current)}
          className="
            absolute -right-3 top-7 z-10 hidden
            h-7 w-7 items-center justify-center
            rounded-full border border-slate-200
            bg-white text-slate-500 shadow-sm
            transition
            hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700
            lg:inline-flex
          "
        >
          {isCollapsed ? (
            <ChevronRight size={15} strokeWidth={2} />
          ) : (
            <ChevronLeft size={15} strokeWidth={2} />
          )}
        </button>

        {/* Mobile close */}
        <button
          type="button"
          aria-label={t("navigation.close")}
          onClick={onClose}
          className="
            absolute right-4 top-4
            flex h-9 w-9 items-center justify-center
            rounded-lg text-slate-400
            hover:bg-slate-100 hover:text-slate-700
            lg:hidden
          "
        >
          <X size={19} />
        </button>

        {/* Branding */}
        <header
          className={`
            flex shrink-0 flex-col items-center justify-center
            border-b border-slate-100
            transition-all duration-300
            ${isCollapsed ? "lg:h-[112px] lg:px-3" : "h-[150px] px-5"}
          `}
        >
          {/* Full logo */}
          <div
            className={`
              flex flex-col items-center
              ${isCollapsed ? "lg:hidden" : ""}
            `}
          >
            <img
              src="/images/acedemy.png"
              alt={t("app.name")}
              className="h-auto w-[185px] object-contain"
            />

            <p className="mt-3 text-sm font-medium text-slate-500">
              {t("app.virtualClassroom")}
            </p>
          </div>

          {/* Collapsed logo */}
          <div
            className={`
              hidden items-center justify-center
              ${isCollapsed ? "lg:flex" : ""}
            `}
          >
            <img
              src="/favicon.png"
              alt={t("app.name")}
              className="h-11 w-11 rounded-xl object-contain"
            />
          </div>
        </header>

        {/* Navigation */}
        <nav
          className={`
            flex-1 space-y-2 py-5
            ${isCollapsed ? "lg:px-3" : "px-4"}
          `}
          aria-label={t("navigation.main")}
        >
          {navItems.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={onClose}
              aria-label={label}
              title={isCollapsed ? label : undefined}
              className={({ isActive }) =>
                `
                  flex h-12 items-center rounded-xl
                  text-sm font-medium
                  transition-colors duration-200

                  ${isCollapsed ? "lg:justify-center lg:px-0" : "gap-3 px-4"}

                  ${
                    isActive
                      ? "bg-sky-50 text-sky-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }
                `
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={20}
                    strokeWidth={1.8}
                    className={`shrink-0 ${
                      isActive ? "text-sky-600" : "text-slate-500"
                    }`}
                  />

                  <span
                    className={`
                      whitespace-nowrap
                      ${isCollapsed ? "lg:hidden" : ""}
                    `}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
