import { useState, type ComponentType } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  House,
  MapPin,
  ReceiptText,
  UserRound,
  Users,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import {
  canManageAdministrators,
  dashboardPath,
} from "../../auth/types";
import { t } from "../../lib/i18n";

type NavItem = {
  label: string;
  icon: ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  to: string;
};

const studentNavItems: NavItem[] = [
  { label: t("navigation.home"), icon: House, to: "/" },
  { label: t("navigation.courses"), icon: BookOpen, to: "/courses" },
  { label: t("navigation.tasks"), icon: ClipboardList, to: "/tasks" },
];

const adminSections = [
  {
    id: "administration",
    label: t("navigation.administration"),
    items: [
      { label: t("navigation.users"), icon: Users, to: "/admin/users" },
      {
        label: t("navigation.revenue"),
        icon: CircleDollarSign,
        to: "/admin/revenue",
      },
    ],
  },
  {
    id: "studentManagement",
    label: t("navigation.studentManagement"),
    items: [
      {
        label: t("navigation.enrollments"),
        icon: ClipboardCheck,
        to: "/admin/enrollments",
      },
      { label: t("payments.title"), icon: Wallet, to: "/admin/payments" },
    ],
  },
  {
    id: "academic",
    label: t("navigation.academicConfiguration"),
    items: [
      {
        label: t("navigation.cycles"),
        icon: CalendarDays,
        to: "/admin/cycles",
      },
      { label: t("navigation.groups"), icon: UsersRound, to: "/admin/groups" },
      { label: t("navigation.branches"), icon: MapPin, to: "/admin/branches" },
      {
        label: t("navigation.enrollmentsPensions"),
        icon: ReceiptText,
        to: "/admin/enrollments-pensions",
      },
    ],
  },
] satisfies { id: string; label: string; items: NavItem[] }[];

type SidebarProps = { isOpen: boolean; onClose: () => void };
type ExpandedSections = Record<string, boolean>;

const EXPANDED_SECTIONS_KEY = "aristoteles.adminSidebar.expandedSections.v2";
const defaultExpandedSections: ExpandedSections = {
  studentManagement: true,
  academic: false,
  administration: false,
};

function readExpandedSections(): ExpandedSections {
  try {
    if (typeof window === "undefined") return defaultExpandedSections;
    const stored = window.localStorage.getItem(EXPANDED_SECTIONS_KEY);
    if (!stored) return defaultExpandedSections;
    const parsed = JSON.parse(stored) as Partial<ExpandedSections>;
    return {
      studentManagement: parsed.studentManagement === true,
      academic: parsed.academic === true,
      administration: parsed.administration === true,
    };
  } catch {
    return defaultExpandedSections;
  }
}

function activeAdminPath(pathname: string, search: string): string {
  if (pathname === "/admin/enrollments" || pathname === "/admin/enrollments/")
    return "/admin/enrollments";
  void search;
  if (pathname === "/admin" || pathname === "/admin/") return "/admin";
  for (const path of [
    "/admin/enrollments-pensions",
    "/admin/payments",
    "/admin/revenue",
    "/admin/users",
    "/admin/groups",
    "/admin/cycles",
    "/admin/branches",
  ])
    if (pathname === path || pathname.startsWith(`${path}/`)) return path;
  return "";
}

function NavigationLink({
  item,
  collapsed,
  onClose,
  activePath,
}: {
  item: NavItem;
  collapsed: boolean;
  onClose: () => void;
  activePath: string;
}) {
  const Icon = item.icon;
  const isActive = activePath === item.to;
  return (
    <Link
      to={item.to}
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={`flex min-h-11 items-center rounded-xl text-sm font-medium transition-colors duration-200 ${collapsed ? "lg:justify-center lg:px-0" : "gap-3 px-3"} ${isActive ? "bg-sky-50 text-sky-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
    >
      <Icon
        size={19}
        strokeWidth={1.8}
        className={`shrink-0 ${isActive ? "text-sky-600" : "text-slate-500"}`}
      />
      <span
        className={`min-w-0 truncate whitespace-nowrap ${collapsed ? "lg:hidden" : ""}`}
      >
        {item.label}
      </span>
    </Link>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const activePath =
    user?.role === "ADMIN"
      ? activeAdminPath(location.pathname, location.search)
      : (studentNavItems.find(
          (item) =>
            item.to !== "/" &&
            (location.pathname === item.to ||
              location.pathname.startsWith(`${item.to}/`)),
        )?.to ?? location.pathname);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expanded, setExpanded] =
    useState<ExpandedSections>(readExpandedSections);
  function toggleSection(sectionId: string) {
    setExpanded((current) => {
      const next = { ...current, [sectionId]: !current[sectionId] };
      try {
        window.localStorage.setItem(
          EXPANDED_SECTIONS_KEY,
          JSON.stringify(next),
        );
      } catch {
        // The in-memory state still works when storage is unavailable.
      }
      return next;
    });
  }
  const toggleLabel = t(
    isCollapsed ? "navigation.expand" : "navigation.collapse",
  );
  const home: NavItem = {
    label: t("navigation.home"),
    icon: House,
    to: user ? dashboardPath(user) : "/login",
  };

  return (
    <>
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
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r border-slate-200 bg-white transition-[width,transform] duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "lg:w-[76px]" : "w-[280px] lg:w-[260px]"}`}
      >
        <button
          type="button"
          aria-label={toggleLabel}
          title={toggleLabel}
          onClick={() => setIsCollapsed((current) => !current)}
          className="absolute -right-3 top-7 z-10 hidden h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 lg:inline-flex"
        >
          {isCollapsed ? (
            <ChevronRight size={15} strokeWidth={2} />
          ) : (
            <ChevronLeft size={15} strokeWidth={2} />
          )}
        </button>
        <button
          type="button"
          aria-label={t("navigation.close")}
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
        >
          <X size={19} />
        </button>

        <header
          className={`flex shrink-0 flex-col items-center justify-center border-b border-slate-100 transition-all duration-300 ${isCollapsed ? "lg:h-[112px] lg:px-3" : "h-[150px] px-5"}`}
        >
          <div
            className={`flex flex-col items-center ${isCollapsed ? "lg:hidden" : ""}`}
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
          <div
            className={`hidden items-center justify-center ${isCollapsed ? "lg:flex" : ""}`}
          >
            <img
              src="/favicon.png"
              alt={t("app.name")}
              className="h-11 w-11 rounded-xl object-contain"
            />
          </div>
        </header>

        <nav
          className={`flex-1 overflow-y-auto overscroll-contain py-4 ${isCollapsed ? "lg:px-3" : "px-3"}`}
          aria-label={t("navigation.main")}
        >
          {user?.role === "STUDENT" ? (
            <div className="space-y-1">
              {studentNavItems.map((item) => (
                <NavigationLink
                  key={item.to}
                  item={item}
                  collapsed={isCollapsed}
                  onClose={onClose}
                  activePath={activePath}
                />
              ))}
            </div>
          ) : user?.role === "ADMIN" ? (
            <div className="space-y-3">
              {canManageAdministrators(user) && (
                <NavigationLink
                  item={home}
                  collapsed={isCollapsed}
                  onClose={onClose}
                  activePath={activePath}
                />
              )}

              {adminSections.map((section) => {
                const isExpanded = expanded[section.id];
                return (
                  <section
                    key={section.id}
                    aria-labelledby={`sidebar-${section.id}`}
                  >
                    <button
                      id={`sidebar-${section.id}`}
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={`sidebar-${section.id}-items`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleSection(section.id);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 hover:bg-slate-50 hover:text-slate-600 ${isCollapsed ? "lg:hidden" : ""}`}
                    >
                      {section.label}
                      <ChevronDown
                        size={15}
                        className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>
                    <div
                      id={`sidebar-${section.id}-items`}
                      className="mt-1 space-y-1"
                    >
                      {(isExpanded || isCollapsed) &&
                        section.items.map((item) => (
                          <NavigationLink
                            key={item.to}
                            item={item}
                            collapsed={isCollapsed}
                            onClose={onClose}
                            activePath={activePath}
                          />
                        ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1">
              <NavigationLink
                item={home}
                collapsed={isCollapsed}
                onClose={onClose}
                activePath={activePath}
              />
              <NavigationLink
                item={{
                  label: t("navigation.profile"),
                  icon: UserRound,
                  to: "/profile",
                }}
                collapsed={isCollapsed}
                onClose={onClose}
                activePath={activePath}
              />
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
