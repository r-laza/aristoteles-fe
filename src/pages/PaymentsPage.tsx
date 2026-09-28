import { useEffect, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { t } from "../lib/i18n";
import {
  readCycles,
  orderCycles,
  todayKey,
  type AcademicCycle,
} from "../features/cycles/cycles";
import { CyclePayments } from "../features/payments/CyclePayments";
export function PaymentsPage() {
  const [cycles, setCycles] = useState<AcademicCycle[]>([]);
  const [cycleId, setCycleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    readCycles()
      .then((list) => {
        if (!cancelled) {
          const sorted = orderCycles(list, todayKey());
          setCycles(sorted);
          setCycleId(sorted[0]?.id ?? null);
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
  return (
    <AppLayout
      banner={{
        src: "/images/banner-aristoteles.png",
        alt: t("dashboard.bannerAlt"),
      }}
    >
      <div className="py-5">
        <h1 className="text-3xl font-bold tracking-tight text-sky-950">
          {t("payments.title")}
        </h1>
        <p className="mt-2 mb-6 text-slate-500">{t("payments.subtitle")}</p>
        {loading ? (
          <p role="status">{t("payments.loading")}</p>
        ) : error ? (
          <div role="alert">
            <p>{t("payments.loadError")}</p>
            <button
              className="primary-button mt-4"
              onClick={() => {
                setLoading(true);
                setVersion((value) => value + 1);
              }}
            >
              {t("dashboard.retry")}
            </button>
          </div>
        ) : cycles.length === 0 ? (
          <p className="rounded-2xl bg-white p-6">{t("payments.noCycles")}</p>
        ) : (
          <>
            <div className="max-w-md">
              <label htmlFor="payments-cycle" className="field-label">
                {t("payments.cycle")}
              </label>
              <select
                id="payments-cycle"
                value={cycleId ?? ""}
                onChange={(event) => setCycleId(Number(event.target.value))}
                className="field"
              >
                {cycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name}
                  </option>
                ))}
              </select>
            </div>
            {cycleId !== null && (
              <CyclePayments key={cycleId} cycleId={cycleId} />
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
