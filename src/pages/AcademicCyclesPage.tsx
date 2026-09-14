import { Link } from "react-router-dom";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CalendarDays, Plus, X } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { t } from "../lib/i18n";
import {
  cycleStatus,
  formatCycleDate,
  orderCycles,
  readCycles,
  saveCycle,
  todayKey,
  type AcademicCycle,
} from "../features/cycles/cycles";

function CreateCycleModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (cycle: AcademicCycle) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name")).trim();
    const endDate = String(data.get("endDate"));
    const baseFee = Number(data.get("baseFee"));
    if (
      !name ||
      !startDate ||
      !endDate ||
      !Number.isFinite(baseFee) ||
      baseFee < 0
    ) {
      setError(t("cycles.invalid"));
      return;
    }
    if (endDate < startDate) {
      setError(t("cycles.invalidDates"));
      return;
    }
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      onCreated(
        await saveCycle({
          name,
          startDate,
          endDate,
          baseFee,
        }),
      );
    } catch {
      setError(t("cycles.saveError"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      aria-labelledby="cycle-modal-title"
      className="w-[calc(100%-2rem)] max-w-lg rounded-2xl p-6 text-slate-800 shadow-xl backdrop:bg-slate-950/50"
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 id="cycle-modal-title" className="text-xl font-bold text-sky-950">
          {t("cycles.create")}
        </h2>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label={t("admin.close")}
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="cycle-name" className="field-label">
            {t("cycles.name")}
          </label>
          <input
            autoFocus
            id="cycle-name"
            name="name"
            required
            maxLength={100}
            className="field"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cycle-start" className="field-label">
              {t("cycles.startDate")}
            </label>
            <input
              id="cycle-start"
              name="startDate"
              type="date"
              required
              max="9999-12-31"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="cycle-end" className="field-label">
              {t("cycles.endDate")}
            </label>
            <input
              id="cycle-end"
              name="endDate"
              type="date"
              required
              min={startDate || undefined}
              max="9999-12-31"
              className="field"
            />
          </div>
        </div>
        <div>
          <label htmlFor="cycle-fee" className="field-label">
            {t("cycles.baseFee")}
          </label>
          <input
            id="cycle-fee"
            name="baseFee"
            type="number"
            min="0"
            step="0.01"
            required
            className="field"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-xl border px-4 py-2"
          >
            {t("admin.cancel")}
          </button>
          <button disabled={busy} className="primary-button">
            {t(busy ? "admin.saving" : "cycles.create")}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function AcademicCyclesPage() {
  const [cycles, setCycles] = useState<AcademicCycle[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
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
          <button
            className="primary-button"
            onClick={() => {
              setSuccess(false);
              setOpen(true);
            }}
          >
            <Plus size={18} aria-hidden="true" />
            {t("cycles.create")}
          </button>
        </div>
        {success && (
          <p
            role="status"
            className="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-800"
          >
            {t("cycles.success")}
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
            <CalendarDays size={32} className="mx-auto mb-4 text-cyan-600" />
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
                  <Link
                    to={`/admin/cycles/${cycle.id}`}
                    className={`block rounded-2xl border bg-white transition hover:border-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 p-5 shadow-sm sm:p-6 ${status === "active" ? "border-cyan-200 ring-1 ring-cyan-100" : "border-slate-100"}`}
                  >
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                      <div
                        className={`rounded-xl p-2.5 ${status === "active" ? "bg-cyan-50 text-cyan-700" : "bg-slate-50 text-slate-500"}`}
                      >
                        <CalendarDays size={23} />
                      </div>
                      <h2 className="min-w-0 break-words text-xl font-semibold text-sky-950">
                        {cycle.name}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold sm:ml-auto ${badge[status]}`}
                      >
                        {t(`cycles.${status}`)}
                      </span>
                    </div>
                    <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-5">
                      {[
                        ["cycles.start", formatCycleDate(cycle.startDate)],
                        ["cycles.end", formatCycleDate(cycle.endDate)],
                        [
                          "cycles.baseFee",
                          t("cycles.amount", {
                            amount: cycle.baseFee.toLocaleString("es-EC", {
                              maximumFractionDigits: 2,
                            }),
                          }),
                        ],
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
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
        {open && (
          <CreateCycleModal
            onClose={() => setOpen(false)}
            onCreated={(updated) => {
              setCycles((current) => [...current, updated]);
              setLoadError(false);
              setOpen(false);
              setSuccess(true);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
