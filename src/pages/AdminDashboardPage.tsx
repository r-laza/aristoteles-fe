import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CircleDollarSign,
  GraduationCap,
  TriangleAlert,
  WalletCards,
} from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import {
  ChartLegend,
  DonutChart,
  MonthlyRevenueChart,
} from "../components/dashboard/AdminDashboardCharts";
import { money } from "../features/payments/formatting";
import {
  orderCycles,
  readCycles,
  todayKey,
  type AcademicCycle,
} from "../features/cycles/cycles";
import { t } from "../lib/i18n";
import { fetchAdminDashboard } from "../services/dashboard.api";
import type { AdminDashboardResponse } from "../types/admin-dashboard";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-sky-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function AdminDashboardPage() {
  const banner = {
    src: "/images/banner-aristoteles.png",
    alt: t("dashboard.bannerAlt"),
  };
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(
    null,
  );
  const [cycles, setCycles] = useState<AcademicCycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [activeCycleId, setActiveCycleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([readCycles(), fetchAdminDashboard()])
      .then(([cycleList, value]) => {
        if (!cancelled) {
          setCycles(orderCycles(cycleList, todayKey()));
          setDashboard(value);
          setSelectedCycleId(value?.activeCycle.id ?? null);
          setActiveCycleId(value?.activeCycle.id ?? null);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const selectCycle = (cycleId: number) => {
    const currentRequest = ++requestId.current;
    setSelectedCycleId(cycleId);
    setDashboard(null);
    setLoading(true);
    setError(false);
    fetchAdminDashboard(cycleId)
      .then((value) => {
        if (requestId.current === currentRequest) setDashboard(value);
      })
      .catch(() => {
        if (requestId.current === currentRequest) setError(true);
      })
      .finally(() => {
        if (requestId.current === currentRequest) setLoading(false);
      });
  };

  if (loading && cycles.length === 0 && selectedCycleId === null && !error)
    return (
      <AppLayout banner={banner}>
        <p role="status" className="py-16 text-center text-slate-500">
          {t("adminDashboard.loading")}
        </p>
      </AppLayout>
    );

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
          label: t("adminDashboard.totalCollected"),
          value: money(summary.totalCollected),
          icon: CircleDollarSign,
          tone: "bg-emerald-50 text-emerald-700",
        },
        {
          label: t("adminDashboard.outstandingBalance"),
          value: money(summary.outstandingBalance),
          icon: WalletCards,
          tone: "bg-amber-50 text-amber-700",
        },
        {
          label: t("adminDashboard.studentsWithDebt"),
          value: String(summary.studentsWithDebt),
          icon: TriangleAlert,
          tone: "bg-rose-50 text-rose-700",
        },
      ]
    : [];

  return (
    <AppLayout banner={banner}>
      <div className="py-5">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-sky-950">
            {t("navigation.home")}
          </h1>
          <p className="mt-2 text-slate-500">{t("adminDashboard.subtitle")}</p>
          <div className="mt-5 max-w-sm">
            <label htmlFor="dashboard-cycle" className="field-label">
              {t("payments.cycle")}
            </label>
            <select
              id="dashboard-cycle"
              className="field"
              value={selectedCycleId ?? ""}
              disabled={loading}
              onChange={(event) => selectCycle(Number(event.target.value))}
            >
              <option value="" disabled>
                {t("adminDashboard.selectCycle")}
              </option>
              {cycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name}
                  {cycle.id === activeCycleId
                    ? ` — ${t("adminDashboard.activeCycle")}`
                    : ""}
                </option>
              ))}
            </select>
          </div>
        </header>

        {loading ? (
          <p role="status" className="py-16 text-center text-slate-500">
            {t("adminDashboard.loading")}
          </p>
        ) : error ? (
          <div role="alert" className="py-16 text-center">
            <p className="text-slate-600">{t("adminDashboard.error")}</p>
            <button
              className="primary-button mt-4"
              onClick={() => {
                if (selectedCycleId !== null) selectCycle(selectedCycleId);
                else {
                  setLoading(true);
                  setVersion((value) => value + 1);
                }
              }}
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

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map(({ label, value, icon: Icon, tone }) => (
                <article
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className={`inline-flex rounded-xl p-2.5 ${tone}`}>
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-sm text-slate-500">{label}</p>
                  <p className="mt-1 break-words text-2xl font-bold text-sky-950 sm:text-3xl">
                    {value}
                  </p>
                </article>
              ))}
            </section>

            <div className="mt-6">
              <Panel title={t("adminDashboard.monthlyRevenue")}>
                <div className="mb-4">
                  <ChartLegend />
                </div>
                <MonthlyRevenueChart data={dashboard.monthlyCollected} />
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
                      label: t("adminDashboard.withDebt"),
                      value: summary.studentsWithDebt,
                      color: "#f43f5e",
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
                      value: amount(summary.enrollmentCollected),
                      displayValue: money(summary.enrollmentCollected),
                      color: "#075985",
                    },
                    {
                      label: t("adminDashboard.pensions"),
                      value: amount(summary.pensionCollected),
                      displayValue: money(summary.pensionCollected),
                      color: "#22d3ee",
                    },
                  ]}
                />
              </Panel>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

const amount = (value: string) => Number(value);
