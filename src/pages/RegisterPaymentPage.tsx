import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { readCycles } from "../features/cycles/cycles";
import { RegisterPayment } from "../features/payments/RegisterPayment";
import { t } from "../lib/i18n";
import { paymentsApi, type PaymentRow } from "../services/payments.api";

type RegistrationData = { row: PaymentRow; cycleId: number };

async function findRegistration(
  enrollmentId: number,
  requestedCycleId: number | null,
): Promise<RegistrationData | null> {
  if (requestedCycleId !== null) {
    const balances = await paymentsApi.balances(requestedCycleId);
    const row = balances.rows.find((item) => item.id === enrollmentId);
    return row ? { row, cycleId: requestedCycleId } : null;
  }

  const cycles = await readCycles();
  for (const cycle of cycles) {
    const balances = await paymentsApi.balances(cycle.id);
    const row = balances.rows.find((item) => item.id === enrollmentId);
    if (row) return { row, cycleId: cycle.id };
  }
  return null;
}

export function RegisterPaymentPage() {
  const navigate = useNavigate();
  const { enrollmentId: enrollmentIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const enrollmentId = Number(enrollmentIdParam);
  const cycleIdParam = Number(searchParams.get("cycleId"));
  const requestedCycleId =
    Number.isInteger(cycleIdParam) && cycleIdParam > 0 ? cycleIdParam : null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const registration =
      Number.isInteger(enrollmentId) && enrollmentId > 0
        ? findRegistration(enrollmentId, requestedCycleId)
        : Promise.resolve(null);
    registration
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(!result);
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
  }, [enrollmentId, requestedCycleId]);

  const paymentsPath = data?.cycleId
    ? `/admin/payments?cycleId=${data.cycleId}`
    : "/admin/payments";

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl py-5">
        <Link
          to={paymentsPath}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-800 hover:text-sky-950"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          {t("payments.backToManagement")}
        </Link>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-sky-950">
            {t("payments.register")}
          </h1>
          <p className="mt-2 text-slate-500">
            {t("payments.registerSubtitle")}
          </p>
        </div>

        {loading ? (
          <p role="status" className="rounded-2xl bg-white p-6">
            {t("payments.loading")}
          </p>
        ) : error || !data ? (
          <div role="alert" className="rounded-2xl bg-white p-6">
            <p>{t("payments.registrationNotFound")}</p>
            <Link to="/admin/payments" className="primary-button mt-4">
              {t("payments.backToManagement")}
            </Link>
          </div>
        ) : (
          <RegisterPayment
            row={data.row}
            onCancel={() => navigate(paymentsPath)}
            onSaved={() =>
              navigate(paymentsPath, {
                state: { paymentRegistered: true },
                replace: true,
              })
            }
          />
        )}
      </div>
    </AppLayout>
  );
}
