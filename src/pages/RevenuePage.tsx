import { useEffect, useState } from "react";
import { CalendarDays, CircleDollarSign, ReceiptText } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { canManageAdministrators } from "../auth/types";
import { useAuth } from "../auth/useAuth";
import { t } from "../lib/i18n";
import {
  revenueApi,
  type RevenueFilters,
  type RevenueReport,
} from "../services/revenue.api";

const money = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});
const dateFormat = new Intl.DateTimeFormat("es-PE", { timeZone: "UTC" });

function dateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function quickRange(kind: "today" | "week" | "month") {
  const today = new Date();
  if (kind === "today") return { from: dateKey(today), to: dateKey(today) };
  const from = new Date(today);
  if (kind === "week") {
    const day = (today.getDay() + 6) % 7;
    from.setDate(today.getDate() - day);
  } else from.setDate(1);
  return { from: dateKey(from), to: dateKey(today) };
}

const initialFilters: RevenueFilters = { page: 1 };

export function RevenuePage() {
  const { user } = useAuth();
  const isMain = canManageAdministrators(user);
  const [filters, setFilters] = useState<RevenueFilters>(initialFilters);
  const [report, setReport] = useState<RevenueReport>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      revenueApi
        .report(filters)
        .then((value) => {
          if (!cancelled) {
            setReport(value);
            setError(false);
          }
        })
        .catch(() => {
          if (!cancelled) setError(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, filters.search ? 250 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [filters, version]);

  function update(next: Partial<RevenueFilters>) {
    setFilters((current) => ({ ...current, ...next, page: next.page ?? 1 }));
  }

  return (
    <AppLayout>
      <div className="py-5">
        <h1 className="text-3xl font-bold tracking-tight text-sky-950">
          {t("revenue.title")}
        </h1>
        <p className="mt-2 text-slate-500">{t("revenue.subtitle")}</p>

        <div className="my-6 grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <CircleDollarSign className="mb-3 text-sky-700" aria-hidden="true" />
            <p className="text-sm text-slate-500">{t("revenue.total")}</p>
            <p className="mt-1 text-2xl font-bold text-sky-950">
              {money.format(Number(report?.totals.amount ?? 0))}
            </p>
          </section>
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <ReceiptText className="mb-3 text-sky-700" aria-hidden="true" />
            <p className="text-sm text-slate-500">{t("revenue.paymentCount")}</p>
            <p className="mt-1 text-2xl font-bold text-sky-950">
              {report?.totals.count ?? 0}
            </p>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap gap-2" aria-label={t("revenue.quickDates")}>
            {(["today", "week", "month"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                className="secondary-button"
                onClick={() => update(quickRange(kind))}
              >
                {t(`revenue.${kind}`)}
              </button>
            ))}
            <span className="inline-flex items-center gap-2 px-2 text-sm text-slate-500">
              <CalendarDays size={17} aria-hidden="true" />
              {t("revenue.custom")}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {isMain && (
              <label className="block">
                <span className="field-label">{t("revenue.administrator")}</span>
                <select className="field" value={filters.administratorId ?? ""} onChange={(event) => update({ administratorId: Number(event.target.value) || undefined })}>
                  <option value="">{t("revenue.allAdministrators")}</option>
                  {report?.filters.administrators.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
                </select>
              </label>
            )}
            <FilterSelect label={t("revenue.cycle")} value={filters.cycleId} all={t("revenue.allCycles")} options={report?.filters.cycles} onChange={(cycleId) => update({ cycleId })} />
            <FilterSelect label={t("revenue.branch")} value={filters.branchId} all={t("revenue.allBranches")} options={report?.filters.branches} onChange={(branchId) => update({ branchId })} />
            <label className="block">
              <span className="field-label">{t("revenue.method")}</span>
              <select className="field" value={filters.paymentMethod ?? ""} onChange={(event) => update({ paymentMethod: (event.target.value || undefined) as RevenueFilters["paymentMethod"] })}>
                <option value="">{t("revenue.allMethods")}</option>
                {(["CASH", "TRANSFER", "YAPE", "PLIN"] as const).map((method) => <option key={method} value={method}>{t(`payments.methods.${method}`)}</option>)}
              </select>
            </label>
            <label className="block"><span className="field-label">{t("revenue.from")}</span><input type="date" className="field" value={filters.from ?? ""} onChange={(event) => update({ from: event.target.value || undefined })} /></label>
            <label className="block"><span className="field-label">{t("revenue.to")}</span><input type="date" className="field" value={filters.to ?? ""} onChange={(event) => update({ to: event.target.value || undefined })} /></label>
          </div>
          <label className="mt-4 block max-w-xl">
            <span className="field-label">{t("revenue.search")}</span>
            <input className="field" value={filters.search ?? ""} placeholder={t("revenue.searchPlaceholder")} onChange={(event) => update({ search: event.target.value })} />
          </label>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {loading ? <p className="p-6" role="status">{t("revenue.loading")}</p> : error ? <div className="p-6" role="alert"><p>{t("revenue.error")}</p><button className="primary-button mt-4" onClick={() => setVersion((value) => value + 1)}>{t("dashboard.retry")}</button></div> : !report?.rows.length ? <p className="p-6 text-slate-500">{t("revenue.empty")}</p> : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600"><tr>{["date", "administrator", "student", "cycle", "branch", "method", "amount"].map((key) => <th key={key} className="px-4 py-3 font-semibold">{t(`revenue.${key}`)}</th>)}</tr></thead>
                  <tbody className="divide-y divide-slate-100">{report.rows.map((row) => <tr key={row.id} className="hover:bg-slate-50/70"><td className="px-4 py-4 whitespace-nowrap">{dateFormat.format(new Date(row.date))}</td><td className="px-4 py-4">{row.administrator?.fullName ?? t("revenue.unassigned")}</td><td className="px-4 py-4"><span className="block font-medium text-slate-900">{row.student.fullName}</span><span className="text-xs text-slate-500">{row.student.dni}</span></td><td className="px-4 py-4">{row.cycle.name}</td><td className="px-4 py-4">{row.branch.name}</td><td className="px-4 py-4">{t(`payments.methods.${row.paymentMethod}`)}</td><td className="px-4 py-4 font-semibold text-slate-900">{money.format(Number(row.amount))}</td></tr>)}</tbody>
                </table>
              </div>
              <nav className="flex flex-col items-center justify-between gap-3 border-t p-4 sm:flex-row" aria-label={t("revenue.pagination")}><p className="text-sm text-slate-500">{t("revenue.resultCount", { count: report.pagination.total })}</p><div className="flex items-center gap-3"><button className="secondary-button" disabled={filters.page <= 1} onClick={() => update({ page: filters.page - 1 })}>{t("revenue.previous")}</button><span className="text-sm">{t("revenue.pageOf", { page: report.pagination.page, total: report.pagination.pages })}</span><button className="secondary-button" disabled={filters.page >= report.pagination.pages} onClick={() => update({ page: filters.page + 1 })}>{t("revenue.next")}</button></div></nav>
            </>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function FilterSelect({ label, value, all, options, onChange }: { label: string; value?: number; all: string; options?: { id: number; name: string }[]; onChange: (value?: number) => void }) {
  return <label className="block"><span className="field-label">{label}</span><select className="field" value={value ?? ""} onChange={(event) => onChange(Number(event.target.value) || undefined)}><option value="">{all}</option>{options?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>;
}
