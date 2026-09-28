import { useState } from "react";
import { Search, CheckCircle2 } from "lucide-react";
import { t } from "../../lib/i18n";
import type { PaymentRow } from "../../services/payments.api";
import { PaymentFilters } from "./PaymentFilters";
import { PaymentSummary } from "./PaymentSummary";
import { PaymentsTable } from "./PaymentsTable";
import { PaymentHistory } from "./PaymentHistory";
import { RegisterPayment } from "./RegisterPayment";
import { emptyFilters, filterPaymentRows } from "./paymentView";
import { useCyclePayments } from "./useCyclePayments";

export function CyclePayments({ cycleId }: { cycleId: number }) {
  const { data, loading, error, refresh } = useCyclePayments(cycleId);
  const [filters, setFilters] = useState(emptyFilters);
  const [success, setSuccess] = useState(false);
  const [selected, setSelected] = useState<{
    row: PaymentRow;
    mode: "register" | "history";
  } | null>(null);
  if (loading)
    return (
      <p role="status" className="py-8 text-sm text-slate-500">
        {t("payments.loading")}
      </p>
    );
  if (error || !data)
    return (
      <div role="alert" className="mt-6 rounded-2xl bg-white p-6">
        <p>{t("payments.loadError")}</p>
        <button className="primary-button mt-4" onClick={refresh}>
          {t("dashboard.retry")}
        </button>
      </div>
    );
  const rows = filterPaymentRows(data.rows, filters);
  const groups = Array.from(
    new Map(data.rows.map((row) => [row.group.id, row.group])).values(),
  );
  const months = Array.from(
    new Set(
      data.rows.flatMap((row) =>
        row.obligations.flatMap((c) => (c.period ? [c.period] : [])),
      ),
    ),
  ).sort();
  const filtered = Object.values(filters).some(Boolean);
  return (
    <>
      <PaymentSummary data={data} />
      {success && (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <CheckCircle2 size={18} aria-hidden="true" />
          {t("payments.success")}
        </p>
      )}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-sky-950">
                {t("payments.enrollments")}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {t("payments.scopeHint")}
              </p>
            </div>
            <span
              role="status"
              className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500"
            >
              {t("payments.resultCount", {
                count: rows.length,
                total: data.rows.length,
              })}
            </span>
          </div>
          <PaymentFilters
            filters={filters}
            groups={groups}
            months={months}
            onChange={setFilters}
          />
          {filtered && (
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500">
                {t("payments.filteredHint")}
              </span>
              <button
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-50"
                onClick={() => setFilters(emptyFilters)}
              >
                {t("payments.clearFilters")}
              </button>
            </div>
          )}
        </div>
        {rows.length === 0 ? (
          <div className="border-t border-slate-100 px-6 py-12 text-center">
            <Search
              size={24}
              aria-hidden="true"
              className="mx-auto mb-3 text-slate-300"
            />
            <p className="text-sm text-slate-500">
              {t(data.rows.length ? "payments.noResults" : "payments.empty")}
            </p>
          </div>
        ) : (
          <PaymentsTable
            rows={rows}
            onRegister={(row) => {
              setSuccess(false);
              setSelected({ row, mode: "register" });
            }}
            onHistory={(row) => setSelected({ row, mode: "history" })}
          />
        )}
      </section>
      {selected &&
        (selected.mode === "history" ? (
          <PaymentHistory
            row={selected.row}
            onClose={() => setSelected(null)}
          />
        ) : (
          <RegisterPayment
            row={selected.row}
            onClose={() => setSelected(null)}
            onSaved={() => {
              setSelected(null);
              setSuccess(true);
              refresh();
            }}
          />
        ))}
    </>
  );
}
