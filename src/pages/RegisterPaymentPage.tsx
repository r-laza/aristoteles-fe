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
import { PaymentDialog } from "../features/payments/PaymentDialog";
import { PaymentHistory } from "../features/payments/PaymentHistory";
import {
  downloadReceiptPdf,
  viewReceiptPdf,
} from "../features/payments/receiptPdf";
import { money } from "../features/payments/formatting";
import { t } from "../lib/i18n";
import {
  paymentsApi,
  type PaymentRegistration,
  type PaymentRow,
} from "../services/payments.api";

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
  const [completed, setCompleted] = useState<PaymentRegistration | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [activeTab, setActiveTab] = useState<"register" | "history">(
    searchParams.get("tab") === "history" ? "history" : "register",
  );
  const enrollmentId = Number(enrollmentIdParam);
  const cycleIdParam = Number(searchParams.get("cycleId"));
  const requestedCycleId =
    Number.isInteger(cycleIdParam) && cycleIdParam > 0 ? cycleIdParam : null;
  const returnToCycle = searchParams.get("returnTo") === "cycle";

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
  const cyclePath = data?.cycleId
    ? `/admin/cycles/${data.cycleId}`
    : paymentsPath;

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-[1600px] py-5">
        <Link
          to={paymentsPath}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-800 hover:text-sky-950"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          {t("payments.backToManagement")}
        </Link>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-sky-950">
            {t("payments.manage")}
          </h1>
          <p className="mt-2 text-slate-500">{t("payments.manageSubtitle")}</p>
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
          <>
            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-slate-500">{t("payments.student")}</dt>
                  <dd className="font-semibold text-sky-950">
                    {data.row.student.fullName}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">{t("payments.cycle")}</dt>
                  <dd className="font-semibold text-sky-950">
                    {data.row.cycle}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">{t("payments.group")}</dt>
                  <dd className="font-semibold text-sky-950">
                    {data.row.group.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">{t("payments.balance")}</dt>
                  <dd className="font-semibold text-sky-950">
                    {money(data.row.balance)}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <h2 className="text-sm font-semibold text-sky-950">
                  {t("payments.defaultPayer")}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {data.row.student.representativeName} ·{" "}
                  {data.row.student.representativeDocumentType
                    ? t(
                        `receipts.documentTypes.${data.row.student.representativeDocumentType}`,
                      )
                    : t("admin.unavailable")}{" "}
                  {data.row.student.representativeDocumentNumber ?? ""} ·{" "}
                  {t(`receipts.relationships.${data.row.student.relationship}`)}
                </p>
              </div>
            </section>
            <div
              className="mb-6 flex gap-1 border-b border-slate-200"
              role="tablist"
              aria-label={t("payments.manageTabs")}
            >
              {(["register", "history"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === tab ? "border-sky-700 text-sky-900" : "border-transparent text-slate-500 hover:text-sky-800"}`}
                >
                  {t(
                    tab === "register"
                      ? "payments.register"
                      : "payments.history",
                  )}
                </button>
              ))}
            </div>
            {activeTab === "register" ? (
              <RegisterPayment
                row={data.row}
                onCancel={() =>
                  navigate(returnToCycle ? cyclePath : paymentsPath)
                }
                onSaved={setCompleted}
              />
            ) : (
              <PaymentHistory row={data.row} />
            )}
          </>
        )}
        {completed && data && completed.payments[0] && (
          <PaymentDialog
            title={t("payments.success")}
            busy={downloading}
            onClose={() =>
              navigate(returnToCycle ? cyclePath : paymentsPath, {
                state: { paymentRegistered: true },
                replace: true,
              })
            }
          >
            <dl className="grid gap-4 rounded-xl bg-emerald-50 p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">{t("payments.student")}</dt>
                <dd className="font-semibold text-sky-950">
                  {data.row.student.fullName}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("payments.amountPaid")}</dt>
                <dd className="font-semibold text-sky-950">
                  {money(completed.totalAmount)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("payments.payer")}</dt>
                <dd className="font-semibold text-sky-950">
                  {completed.payments[0].payerName}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("receipts.document")}</dt>
                <dd className="font-semibold text-sky-950">
                  {t(
                    `receipts.documentTypes.${completed.payments[0].payerDocumentType}`,
                  )}{" "}
                  {completed.payments[0].payerDocumentNumber}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("payments.method")}</dt>
                <dd className="font-semibold text-sky-950">
                  {t(`payments.methods.${completed.payments[0].paymentMethod}`)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">
                  {t("payments.receiptNumber")}
                </dt>
                <dd className="font-semibold text-sky-950">
                  {completed.payments[0].receiptNumber}
                </dd>
              </div>
            </dl>
            {downloadError && (
              <p role="alert" className="mt-4 text-sm text-red-700">
                {downloadError}
              </p>
            )}
            {completed.evidenceUploadFailed && (
              <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                {t("payments.evidenceUploadFailed")}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={downloading}
                onClick={() =>
                  navigate(returnToCycle ? cyclePath : paymentsPath, {
                    state: { paymentRegistered: true },
                    replace: true,
                  })
                }
                className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t("admin.close")}
              </button>
              <button
                type="button"
                disabled={downloading}
                onClick={async () => {
                  setDownloading(true);
                  setDownloadError("");
                  try {
                    await viewReceiptPdf(
                      await paymentsApi.receipt(completed.payments[0].id),
                    );
                  } catch {
                    setDownloadError(t("receipts.downloadError"));
                  } finally {
                    setDownloading(false);
                  }
                }}
                className="rounded-xl border border-sky-200 px-4 py-2 font-semibold text-sky-800 hover:bg-sky-50"
              >
                {t("receipts.view")}
              </button>
              <button
                type="button"
                disabled={downloading}
                onClick={async () => {
                  setDownloading(true);
                  setDownloadError("");
                  try {
                    await downloadReceiptPdf(
                      await paymentsApi.receipt(completed.payments[0].id),
                    );
                  } catch {
                    setDownloadError(t("receipts.downloadError"));
                  } finally {
                    setDownloading(false);
                  }
                }}
                className="primary-button"
              >
                {t("receipts.download")}
              </button>
            </div>
          </PaymentDialog>
        )}
      </div>
    </AppLayout>
  );
}
