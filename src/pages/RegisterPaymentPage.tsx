import { useEffect, useRef, useState } from "react";
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
import { uploadPaymentEvidence } from "../features/payments/paymentFeedback";
import {
  downloadReceiptPdf,
  viewReceiptPdf,
} from "../features/payments/receiptPdf";
import { money } from "../features/payments/formatting";
import { t } from "../lib/i18n";
import {
  paymentsApi,
  type EnrollmentPaymentDraft,
  type PaymentRegistration,
  type PaymentRow,
} from "../services/payments.api";
import { ENROLLMENT_DRAFT_KEY } from "../features/payments/enrollmentDraft";

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
  const [draft] = useState<EnrollmentPaymentDraft | null>(() => {
    if (enrollmentIdParam !== "new-enrollment") return null;
    try {
      const stored = window.sessionStorage.getItem(ENROLLMENT_DRAFT_KEY);
      return stored ? (JSON.parse(stored) as EnrollmentPaymentDraft) : null;
    } catch {
      return null;
    }
  });
  const [data, setData] = useState<RegistrationData | null>(
    draft ? { row: draft.row, cycleId: draft.cycleId } : null,
  );
  const [loading, setLoading] = useState(!draft);
  const [error, setError] = useState(false);
  const [completed, setCompleted] = useState<PaymentRegistration | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [refreshingBalances, setRefreshingBalances] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [pendingEvidence, setPendingEvidence] =
    useState<{ file: File; ids: number[] } | null>(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const evidenceBusy = useRef(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [activeTab, setActiveTab] = useState<"register" | "history">(
    searchParams.get("tab") === "history" ? "history" : "register",
  );
  const enrollmentId = Number(enrollmentIdParam);
  const [currentEnrollmentId, setCurrentEnrollmentId] = useState(enrollmentId);
  const cycleIdParam = Number(searchParams.get("cycleId"));
  const requestedCycleId =
    Number.isInteger(cycleIdParam) && cycleIdParam > 0 ? cycleIdParam : null;
  const returnToCycle = searchParams.get("returnTo") === "cycle";
  const returnToEnrollments = searchParams.get("returnTo") === "enrollments";
  const returnBranchId = Number(searchParams.get("branchId"));
  const returnGroupId = Number(searchParams.get("groupId"));

  useEffect(() => {
    if (draft) {
      setLoading(false);
      setError(false);
      return;
    }
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
  }, [draft, enrollmentId, requestedCycleId]);

  const paymentsPath = data?.cycleId
    ? `/admin/payments?cycleId=${data.cycleId}`
    : "/admin/payments";
  const cyclePath = data?.cycleId
    ? `/admin/cycles/${data.cycleId}`
    : paymentsPath;
  const enrollmentsPath = data?.cycleId
    ? `/admin/enrollments?cycleId=${data.cycleId}${Number.isInteger(returnBranchId) && returnBranchId > 0 ? `&branchId=${returnBranchId}` : ""}${Number.isInteger(returnGroupId) && returnGroupId > 0 ? `&groupId=${returnGroupId}` : ""}`
    : "/admin/enrollments";
  const returnPath = returnToEnrollments
    ? enrollmentsPath
    : returnToCycle
      ? cyclePath
      : paymentsPath;

  async function refreshBalances(targetEnrollmentId = currentEnrollmentId) {
    if (!data) return;
    setRefreshingBalances(true);
    setRefreshError("");
    try {
      const balances = await paymentsApi.balances(data.cycleId);
      const row = balances.rows.find((item) => item.id === targetEnrollmentId);
      if (!row) {
        setRefreshError(t("payments.balanceRefreshError"));
        return;
      }
      setData({ row, cycleId: data.cycleId });
    } catch {
      setRefreshError(t("payments.balanceRefreshError"));
    } finally {
      setRefreshingBalances(false);
    }
  }

  async function attachEvidence(pending: { file: File; ids: number[] }) {
    if (evidenceBusy.current) return;
    evidenceBusy.current = true;
    setUploadingEvidence(true);
    try {
      const failedIds = await uploadPaymentEvidence(
        pending.ids,
        pending.file,
        paymentsApi.uploadEvidence,
      );
      setPendingEvidence(
        failedIds.length ? { file: pending.file, ids: failedIds } : null,
      );
      setHistoryVersion((value) => value + 1);
    } finally {
      evidenceBusy.current = false;
      setUploadingEvidence(false);
    }
  }

  function paymentSaved(registration: PaymentRegistration, evidence?: File) {
    if (registration.enrollmentId) {
      setCurrentEnrollmentId(registration.enrollmentId);
      setData((current) =>
        current
          ? { ...current, row: { ...current.row, id: registration.enrollmentId! } }
          : current,
      );
      window.sessionStorage.removeItem(ENROLLMENT_DRAFT_KEY);
    }
    setCompleted(registration);
    setActiveTab("history");
    setHistoryVersion((value) => value + 1);
    void refreshBalances(registration.enrollmentId ?? currentEnrollmentId);
    if (evidence) {
      const pending = {
        file: evidence,
        ids: registration.payments.map((payment) => payment.id),
      };
      setPendingEvidence(pending);
      void attachEvidence(pending);
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-[1600px] py-5">
        <Link
          to={returnPath}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-800 hover:text-sky-950"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          {t(
            returnToEnrollments
              ? "payments.backToEnrollments"
              : "payments.backToManagement",
          )}
        </Link>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-sky-950">
            {t("payments.manage")}
          </h1>
          <p className="mt-2 text-slate-500">{t("payments.manageSubtitle")}</p>
        </div>
        {draft && !completed && (
          <p className="mb-6 rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-sky-900">
            {t("payments.initialPaymentHelp")}
          </p>
        )}

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
                  disabled={
                    registering ||
                    (tab === "register" &&
                      (refreshingBalances || Boolean(refreshError)))
                  }
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
            {completed && (
              <div className="mb-4">
                <p
                  role="status"
                  className="rounded-xl bg-emerald-50 p-3 text-emerald-800"
                >
                  {t("payments.success")}
                </p>
                <button
                  type="button"
                  className="secondary-button mt-3"
                  onClick={() => setShowReceipt(true)}
                >
                  {t("receipts.view")}
                </button>
                <Link to={enrollmentsPath} className="primary-button mt-3 ml-3">
                  {t("payments.backToEnrollments")}
                </Link>
              </div>
            )}
            {refreshError && (
              <div
                role="alert"
                className="mb-4 rounded-xl bg-amber-50 p-3 text-amber-800"
              >
                <p>{refreshError}</p>
                <button
                  type="button"
                  className="primary-button mt-2"
                  onClick={() => void refreshBalances()}
                >
                  {t("dashboard.retry")}
                </button>
              </div>
            )}
            {pendingEvidence && (
              <div className="mb-4 rounded-xl bg-amber-50 p-3 text-amber-800">
                <p role={uploadingEvidence ? "status" : "alert"}>
                  {t(
                    uploadingEvidence
                      ? "payments.evidenceUploading"
                      : "payments.evidenceUploadFailed",
                  )}
                </p>
                {!uploadingEvidence && (
                  <button
                    type="button"
                    className="primary-button mt-2"
                    onClick={() => void attachEvidence(pendingEvidence)}
                  >
                    {t("payments.retryEvidence")}
                  </button>
                )}
              </div>
            )}
            {activeTab === "register" ? (
              <RegisterPayment
                row={data.row}
                onCancel={() => navigate(returnPath)}
                onSaved={paymentSaved}
                onBusyChange={setRegistering}
                registerPayment={
                  draft && !completed
                    ? (input) => paymentsApi.registerInitial(draft, input)
                    : undefined
                }
              />
            ) : (
              <PaymentHistory
                row={data.row}
                recentPayments={completed?.payments}
                version={historyVersion}
              />
            )}
          </>
        )}
        {showReceipt && completed && data && completed.payments[0] && (
          <PaymentDialog
            title={t("payments.success")}
            busy={downloading}
            onClose={() => setShowReceipt(false)}
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
              <p
                role="alert"
                className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800"
              >
                {t("payments.evidenceUploadFailed")}
              </p>
            )}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={downloading}
                onClick={() => setShowReceipt(false)}
                className="min-h-11 w-full rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
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
                className="min-h-11 w-full rounded-xl border border-sky-200 px-4 py-2 font-semibold text-sky-800 hover:bg-sky-50 sm:w-auto"
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
                className="primary-button min-h-11 w-full sm:w-auto"
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
