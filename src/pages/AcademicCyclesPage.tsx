import { CycleCardMenu } from "../features/cycles/CycleCardMenu";
import {
  EditCycleModal,
  DeleteCycleModal,
} from "../features/cycles/CycleActions";
import { ReusableFees } from "../features/cycles/ReusableFees";
import { CycleForm } from "../features/cycles/CycleForm";
import { ReusableGroups } from "../features/cycles/ReusableGroups";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { t } from "../lib/i18n";
import {
  cycleStatus,
  formatCycleDate,
  orderCycles,
  readCycles,
  todayKey,
  type AcademicCycle,
} from "../features/cycles/cycles";

export function AcademicCyclesPage() {
  const [tab, setTab] = useState<"cycles" | "groups" | "fees">("cycles");
  const [cycles, setCycles] = useState<AcademicCycle[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<AcademicCycle | null>(null);
  const [today, setToday] = useState(todayKey);
  useEffect(() => {
    let cancelled = false;
    readCycles()
      .then((data) => {
        if (!cancelled) setCycles(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    const timer = window.setInterval(() => setToday(todayKey()), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);
  const badge = {
    active: "bg-cyan-100 text-sky-800",
    upcoming: "bg-sky-50 text-sky-700",
    finished: "bg-slate-100 text-slate-500",
  };
  return (
    <AppLayout
      banner={{
        src: "/images/banner-aristoteles.png",
        alt: t("dashboard.bannerAlt"),
      }}
    >
      <div className="py-5">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-sky-950">
              {t("cycles.title")}
            </h1>
            <p className="mt-2 text-slate-500">{t("cycles.subtitle")}</p>
          </div>
          {tab === "cycles" && (
            <button
              className="primary-button"
              onClick={() => {
                setSuccess("");
                setOpen(true);
              }}
            >
              <Plus size={18} aria-hidden="true" />
              {t("cycles.create")}
            </button>
          )}
        </div>
        <div className="mb-6 flex gap-2">
          {(["cycles", "groups", "fees"] as const).map((value) => (
            <button
              key={value}
              aria-pressed={tab === value}
              onClick={() => setTab(value)}
              className={`rounded-xl px-4 py-2 font-medium ${tab === value ? "bg-sky-50 text-sky-800" : "text-slate-500 hover:bg-slate-50"}`}
            >
              {t(`cycles.${value}`)}
            </button>
          ))}
        </div>
        {tab === "fees" ? (
          <ReusableFees />
        ) : tab === "groups" ? (
          <ReusableGroups />
        ) : (
          <>
            {success && (
              <p
                role="status"
                className="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-800"
              >
                {t(success)}
              </p>
            )}
            {loading ? (
              <p role="status">{t("cycles.loading")}</p>
            ) : loadError ? (
              <p
                role="alert"
                className="rounded-2xl border border-red-100 bg-white p-6 text-red-700"
              >
                {t("cycles.loadError")}
              </p>
            ) : cycles.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm">
                <CalendarDays
                  size={32}
                  className="mx-auto mb-4 text-cyan-600"
                />
                <h2 className="text-lg font-semibold text-sky-950">
                  {t("cycles.empty")}
                </h2>
                <p className="mt-2 text-slate-500">
                  {t("cycles.emptyDescription")}
                </p>
              </div>
            ) : (
              <ol className="space-y-4">
                {orderCycles(cycles, today).map((cycle) => {
                  const status = cycleStatus(cycle, today);
                  return (
                    <li key={cycle.id}>
                      <div
                        className={`relative block rounded-2xl border bg-white transition hover:border-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 p-5 shadow-sm sm:p-6 ${status === "active" ? "border-cyan-200 ring-1 ring-cyan-100" : "border-slate-100"}`}
                      >
                        <div className="mb-6 flex items-center justify-between gap-3">
                          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                            <div
                              className={`rounded-xl p-2.5 ${status === "active" ? "bg-cyan-50 text-cyan-700" : "bg-slate-50 text-slate-500"}`}
                            >
                              <CalendarDays size={23} />
                            </div>
                            <h2 className="min-w-0 break-words text-xl font-semibold text-sky-950">
                              <Link
                                to={`/admin/cycles/${cycle.id}`}
                                className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-sky-500"
                              >
                                {cycle.name}
                              </Link>
                            </h2>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${badge[status]}`}
                            >
                              {t(`cycles.${status}`)}
                            </span>
                          </div>
                          <CycleCardMenu
                            onEdit={() => {
                              setSuccess("");
                              setEditing(cycle.id);
                            }}
                            onDelete={() => {
                              setSuccess("");
                              setDeleting(cycle);
                            }}
                          />
                        </div>
                        <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
                          {[
                            ["cycles.start", formatCycleDate(cycle.startDate)],
                            ["cycles.end", formatCycleDate(cycle.endDate)],
                            ["cycles.students", cycle.students],
                            ["cycles.groups", cycle.groups],
                          ].map(([label, value]) => (
                            <div key={label} className="min-w-0">
                              <dt className="text-sm text-slate-500">
                                {t(String(label))}
                              </dt>
                              <dd className="mt-1 break-words font-semibold text-slate-800">
                                {value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </>
        )}
        {editing !== null && (
          <EditCycleModal
            key={editing}
            id={editing}
            onClose={() => setEditing(null)}
            onSaved={(updated) => {
              setCycles((current) =>
                current.map((cycle) =>
                  cycle.id === updated.id ? updated : cycle,
                ),
              );
              setEditing(null);
              setSuccess("cycles.updated");
            }}
          />
        )}
        {deleting && (
          <DeleteCycleModal
            cycle={deleting}
            onClose={() => setDeleting(null)}
            onDeleted={() => {
              setCycles((current) =>
                current.filter((cycle) => cycle.id !== deleting.id),
              );
              setDeleting(null);
              setSuccess("cycleActions.deleted");
            }}
          />
        )}
        {open && (
          <CycleForm
            onClose={() => setOpen(false)}
            onCreated={(updated) => {
              setCycles((current) => [...current, updated]);
              setLoadError(false);
              setOpen(false);
              setSuccess("cycles.success");
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
