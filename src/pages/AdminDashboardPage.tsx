import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  BookOpen,
  CircleDollarSign,
  GraduationCap,
  TriangleAlert,
  WalletCards,
} from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import {
  ChartLegend,
  DonutChart,
  EnrollmentGroupChart,
  MonthlyRevenueChart,
} from "../components/dashboard/AdminDashboardCharts";
import { DashboardFinancialLists } from "../features/dashboard/DashboardFinancialLists";
import { money } from "../features/payments/formatting";
import { t } from "../lib/i18n";
import { fetchAdminDashboard } from "../services/dashboard.api";
import type {
  AdminDashboardResponse,
  DashboardFilters,
} from "../types/admin-dashboard";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-sky-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestVersion = useRef(0);

  const load = useCallback((next: DashboardFilters) => {
    const version = ++requestVersion.current;
    setFilters(next);
    setLoading(true);
    setError(false);
    fetchAdminDashboard(next)
      .then((value) => {
        if (version !== requestVersion.current) return;
        setData(value);
        setFilters({
          branchId: value.selectedBranchId ?? undefined,
          cycleId: value.selectedCycleId ?? undefined,
          groupId: value.selectedGroupId ?? undefined,
        });
      })
      .catch(() => {
        if (version === requestVersion.current) setError(true);
      })
      .finally(() => {
        if (version === requestVersion.current) setLoading(false);
      });
  }, []);
  useEffect(() => load({}), [load]);

  const dashboard = data?.dashboard;
  const summary = dashboard?.summary;
  const cards = summary
    ? [
        {
          label: t("adminDashboard.enrolledStudents"),
          value: String(summary.enrolledStudents),
          icon: GraduationCap,
          tone: "bg-sky-50 text-sky-700",
        },
        {
          label: t("adminDashboard.schoolEnrollments"),
          value: String(summary.schoolEnrollments),
          icon: BookOpen,
          tone: "bg-indigo-50 text-indigo-700",
        },
        {
          label: t("adminDashboard.preuniversityEnrollments"),
          value: String(summary.preuniversityEnrollments),
          icon: GraduationCap,
          tone: "bg-violet-50 text-violet-700",
        },
        {
          label: t("adminDashboard.totalCollected"),
          value: money(summary.totalCollected),
          icon: CircleDollarSign,
          tone: "bg-emerald-50 text-emerald-700",
        },
        {
          label: t("adminDashboard.totalOutstandingDebt"),
          value: money(summary.outstandingBalance),
          icon: WalletCards,
          tone: "bg-amber-50 text-amber-700",
        },
        {
          label: t("adminDashboard.totalOverdueDebt"),
          value: money(summary.overdueBalance),
          icon: TriangleAlert,
          tone: "bg-rose-50 text-rose-700",
        },
      ]
    : [];

  return (
    <AppLayout>
      <div className="py-5">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-sky-950">
            {t("navigation.home")}
          </h1>
          <p className="mt-2 text-slate-500">{t("adminDashboard.subtitle")}</p>
          {data && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FilterSelect
                disabled={loading}
                label={t("cycles.branch")}
                value={filters.branchId}
                options={data.branches}
                onChange={(branchId) => load({ branchId })}
              />
              <FilterSelect
                disabled={loading}
                label={t("payments.cycle")}
                value={filters.cycleId}
                options={data.cycles}
                getOptionLabel={(cycle) =>
                  `${cycle.name} — ${t(`cycles.${cycle.status.toLowerCase()}`)}`
                }
                onChange={(cycleId) =>
                  load({ branchId: filters.branchId, cycleId })
                }
              />
              <FilterSelect
                disabled={loading}
                label={t("payments.group")}
                value={filters.groupId}
                options={data.groups}
                allLabel={t("adminDashboard.allGroups")}
                onChange={(groupId) =>
                  load({
                    branchId: filters.branchId,
                    cycleId: filters.cycleId,
                    groupId,
                  })
                }
              />
            </div>
          )}
        </header>
        {loading ? (
          <p role="status" className="py-16 text-center text-slate-500">
            {t("adminDashboard.loading")}
          </p>
        ) : error ? (
          <div role="alert" className="py-16 text-center">
            <p>{t("adminDashboard.error")}</p>
            <button
              className="primary-button mt-4"
              onClick={() => load(filters)}
            >
              {t("dashboard.retry")}
            </button>
          </div>
        ) : !dashboard || !summary ? (
          <div className="mx-auto max-w-2xl py-16 text-center">
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12">
              <h2 className="text-2xl font-bold text-sky-950">
                {t("adminDashboard.noActiveCycle")}
              </h2>
              <p className="mt-3 text-slate-500">
                {t("adminDashboard.noActiveCycleDescription")}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 inline-flex rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800">
              {t("adminDashboard.analyzedCycle", {
                name: dashboard.activeCycle.name,
              })}
            </div>
            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map(({ label, value, icon: Icon, tone }) => (
                <article
                  key={label}
                  className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className={`inline-flex rounded-xl p-2.5 ${tone}`}>
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-sm text-slate-500">{label}</p>
                  <p className="mt-1 break-words text-2xl font-bold tabular-nums text-sky-950 sm:text-3xl">
                    {value}
                  </p>
                </article>
              ))}
            </section>
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <Panel title={t("adminDashboard.schoolEnrollmentGroups")}>
                <p className="mb-5 text-sm text-slate-500">
                  {t("adminDashboard.chartStudentTotal", {
                    count: summary.schoolEnrollments,
                  })}
                </p>
                <EnrollmentGroupChart
                  data={dashboard.enrollmentDistribution.school}
                />
              </Panel>
              <Panel title={t("adminDashboard.preuniversityEnrollmentGroups")}>
                <p className="mb-5 text-sm text-slate-500">
                  {t("adminDashboard.chartStudentTotal", {
                    count: summary.preuniversityEnrollments,
                  })}
                </p>
                <EnrollmentGroupChart
                  data={dashboard.enrollmentDistribution.preuniversity}
                  color="#7c3aed"
                />
              </Panel>
            </div>
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <Panel title={t("adminDashboard.monthlyRevenue")}>
                <div className="mb-4">
                  <ChartLegend />
                </div>
                <MonthlyRevenueChart data={dashboard.monthlyCollected} />
              </Panel>
              <Panel title={t("adminDashboard.paymentMethodDistribution")}>
                <DonutChart
                  centerLabel={t("adminDashboard.collected")}
                  centerValue={money(summary.totalCollected)}
                  percentageTotal={Number(summary.totalCollected)}
                  items={dashboard.paymentMethods.map(({ method, amount }) => ({
                    label: t(`payments.methods.${method}`),
                    value: Number(amount),
                    displayValue: money(amount),
                    color: {
                      CASH: "#10b981",
                      TRANSFER: "#0284c7",
                      YAPE: "#7c3aed",
                      PLIN: "#06b6d4",
                    }[method],
                  }))}
                />
                {Number(dashboard.unrepresentedCollected) > 0 && (
                  <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                    {t("adminDashboard.unrepresentedCollections", {
                      amount: money(dashboard.unrepresentedCollected),
                    })}
                  </p>
                )}
              </Panel>
            </div>
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <Panel title={t("adminDashboard.studentStatus")}>
                <DonutChart
                  centerLabel={t("adminDashboard.students")}
                  centerValue={String(summary.enrolledStudents)}
                  items={[
                    {
                      label: t("adminDashboard.upToDate"),
                      value: summary.upToDateStudents,
                      color: "#10b981",
                    },
                    {
                      label: t("adminDashboard.pending"),
                      value: summary.pendingStudents,
                      color: "#facc15",
                    },
                    {
                      label: t("adminDashboard.overdue"),
                      value: summary.overdueStudents,
                      color: "#ef4444",
                    },
                  ]}
                />
              </Panel>
              <Panel title={t("adminDashboard.revenueDistribution")}>
                <DonutChart
                  centerLabel={t("adminDashboard.collected")}
                  centerValue={money(summary.totalCollected)}
                  items={[
                    {
                      label: t("adminDashboard.enrollments"),
                      value: Number(summary.enrollmentCollected),
                      displayValue: money(summary.enrollmentCollected),
                      color: "#075985",
                    },
                    {
                      label: t("adminDashboard.pensions"),
                      value: Number(summary.pensionCollected),
                      displayValue: money(summary.pensionCollected),
                      color: "#22d3ee",
                    },
                  ]}
                />
              </Panel>
            </div>
            <DashboardFinancialLists filters={filters} />
          </>
        )}
      </div>
    </AppLayout>
  );
}

function FilterSelect<T extends { id: number; name: string }>({
  label,
  value,
  options,
  allLabel,
  getOptionLabel,
  onChange,
  disabled,
}: {
  label: string;
  value?: number;
  options: T[];
  allLabel?: string;
  getOptionLabel?: (option: T) => string;
  onChange: (value?: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <select
        className="field"
        disabled={disabled}
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value ? Number(event.target.value) : undefined)
        }
      >
        {allLabel && <option value="">{allLabel}</option>}
        {!allLabel && !options.length && (
          <option value="">{t("adminDashboard.noCyclesForBranch")}</option>
        )}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {getOptionLabel ? getOptionLabel(option) : option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
