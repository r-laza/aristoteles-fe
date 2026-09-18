import { Link } from "react-router-dom";
import { EnrollmentForm } from "../features/cycles/EnrollmentForm";
import { cycleApi, getCycle, type CycleGroup } from "../features/cycles/cycles";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Wallet, X, History, Plus } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { t } from "../lib/i18n";
import {
  readCycles,
  orderCycles,
  todayKey,
  formatCycleDate,
  type AcademicCycle,
} from "../features/cycles/cycles";
import {
  paymentsApi,
  methods,
  type Balances,
  type PaymentRow,
  type Payment,
} from "../services/payments.api";
import { ApiError } from "../services/api";
const money = (value: string) =>
  t("cycles.amount", {
    amount: Number(value).toLocaleString("es-EC", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  });
function Dialog({
  title,
  busy = false,
  onClose,
  children,
}: {
  title: string;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="payment-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="w-[calc(100%-2rem)] max-w-xl rounded-2xl p-6 text-slate-800 shadow-xl backdrop:bg-slate-950/50"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 id="payment-title" className="text-xl font-bold text-sky-950">
          {title}
        </h2>
        <button
          disabled={busy}
          onClick={onClose}
          aria-label={t("admin.close")}
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function RegisterPayment({
  row,
  onClose,
  onSaved,
}: {
  row: PaymentRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const amount = String(data.get("amount"));
    if (
      Number(amount) <= 0 ||
      Math.round(Number(amount) * 100) > Math.round(Number(row.balance) * 100)
    ) {
      setError(t("payments.overpayment"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await paymentsApi.register(row.id, {
        amount,
        paymentDate: String(data.get("paymentDate")),
        paymentMethod: String(data.get("paymentMethod")),
        reference: String(data.get("reference")).trim(),
        notes: String(data.get("notes")).trim(),
      });
      onSaved();
    } catch (error) {
      setError(
        t(
          error instanceof ApiError && error.status === 409
            ? "payments.overpayment"
            : "payments.saveError",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog title={t("payments.register")} busy={busy} onClose={onClose}>
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <fieldset disabled={busy} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["student", row.student.fullName],
              ["due", money(row.amountDue)],
              ["alreadyPaid", money(row.amountPaid)],
              ["balance", money(row.balance)],
            ].map(([key, value]) => (
              <div key={key}>
                <label htmlFor={`payment-${key}`} className="field-label">
                  {t(`payments.${key}`)}
                </label>
                <input
                  id={`payment-${key}`}
                  readOnly
                  value={value}
                  className="field bg-slate-50"
                />
              </div>
            ))}
          </div>
          <div>
            <label htmlFor="payment-amount" className="field-label">
              {t("payments.amount")}
            </label>
            <input
              autoFocus
              id="payment-amount"
              name="amount"
              type="number"
              min="0.01"
              max={row.balance}
              step="0.01"
              required
              className="field"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="payment-date" className="field-label">
                {t("payments.date")}
              </label>
              <input
                id="payment-date"
                name="paymentDate"
                type="date"
                defaultValue={todayKey()}
                max="9999-12-31"
                required
                className="field"
              />
            </div>
            <div>
              <label htmlFor="payment-method" className="field-label">
                {t("payments.method")}
              </label>
              <select
                id="payment-method"
                name="paymentMethod"
                required
                className="field"
              >
                {methods.map((method) => (
                  <option key={method} value={method}>
                    {t(`payments.methods.${method}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="payment-reference" className="field-label">
              {t("payments.reference")}
            </label>
            <input
              id="payment-reference"
              name="reference"
              maxLength={200}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="payment-notes" className="field-label">
              {t("payments.notes")}
            </label>
            <textarea
              id="payment-notes"
              name="notes"
              maxLength={1000}
              rows={2}
              className="field"
            />
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-xl border px-4 py-2"
          >
            {t("admin.cancel")}
          </button>
          <button disabled={busy} className="primary-button">
            {t(busy ? "admin.saving" : "payments.register")}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
function PaymentHistory({
  row,
  onClose,
}: {
  row: PaymentRow;
  onClose: () => void;
}) {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    paymentsApi
      .history(row.id)
      .then((data) => {
        if (!cancelled) setPayments(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [row.id]);
  return (
    <Dialog title={t("payments.history")} onClose={onClose}>
      <p className="mb-4 break-words font-medium text-sky-950">
        {row.student.fullName}
      </p>
      {error ? (
        <p role="alert">{t("payments.loadError")}</p>
      ) : !payments ? (
        <p role="status">{t("payments.loading")}</p>
      ) : payments.length === 0 ? (
        <p>{t("payments.noHistory")}</p>
      ) : (
        <ol className="space-y-3">
          {payments.map((payment) => (
            <li
              key={payment.id}
              className="rounded-xl border border-slate-100 p-4"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <strong className="text-sky-950">
                  {money(payment.amount)}
                </strong>
                <span className="text-sm text-slate-500">
                  {formatCycleDate(payment.paymentDate.slice(0, 10))}
                </span>
              </div>
              <p className="mt-2 text-sm">
                {t(`payments.methods.${payment.paymentMethod}`)}
              </p>
              {payment.reference && (
                <p className="mt-2 break-words text-sm">
                  {t("payments.reference")}
                  {t("payments.separator")}
                  {payment.reference}
                </p>
              )}
              {payment.notes && (
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-500">
                  {payment.notes}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </Dialog>
  );
}
function EnrollFromPayments({
  cycleId,
  onClose,
  onCreated,
}: {
  cycleId: number;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [data, setData] = useState<{
    cycle: AcademicCycle;
    groups: CycleGroup[];
  } | null>(null);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    Promise.all([getCycle(String(cycleId)), cycleApi.groups(String(cycleId))])
      .then(([cycle, groups]) => {
        if (!cancelled) {
          setData({ cycle, groups });
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [cycleId, version]);
  if (data && data.groups.length > 0)
    return (
      <EnrollmentForm
        id={String(cycleId)}
        groups={data.groups}
        onClose={onClose}
        onCreated={onCreated}
      />
    );
  return (
    <Dialog title={t("cycleDetail.enroll")} onClose={onClose}>
      {error ? (
        <div role="alert">
          <p>{t("cycleDetail.loadError")}</p>
          <button
            className="primary-button mt-4"
            onClick={() => {
              setError(false);
              setVersion((value) => value + 1);
            }}
          >
            {t("dashboard.retry")}
          </button>
        </div>
      ) : !data ? (
        <p role="status">{t("cycles.loading")}</p>
      ) : (
        <div>
          <p>{t("cycleDetail.needGroup")}</p>
          <Link className="primary-button mt-4" to={`/admin/cycles/${cycleId}`}>
            {t("payments.manageGroups")}
          </Link>
        </div>
      )}
    </Dialog>
  );
}
function CycleBalances({ cycleId }: { cycleId: number }) {
  const [data, setData] = useState<Balances | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const [success, setSuccess] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [selected, setSelected] = useState<{
    row: PaymentRow;
    history: boolean;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    paymentsApi
      .balances(cycleId)
      .then((value) => {
        if (!cancelled) {
          setData(value);
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
  }, [cycleId, version]);
  function refresh() {
    setLoading(true);
    setSelected(null);
    setVersion((value) => value + 1);
  }
  const columns = [
    "payments.student",
    "cycleDetail.group",
    "cycleDetail.assignedAmount",
    "cycleDetail.discount",
    "payments.due",
    "payments.paid",
    "payments.remaining",
    "admin.status",
  ];
  const values = (row: PaymentRow) => [
    row.student.fullName,
    row.group.name,
    money(row.baseAmount),
    money(row.discountAmount),
    money(row.amountDue),
    money(row.amountPaid),
    money(row.balance),
    t(`payments.status.${row.status}`),
  ];
  function actions(row: PaymentRow) {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          disabled={row.status === "PAID"}
          onClick={() => {
            setSuccess(false);
            setSelected({ row, history: false });
          }}
          className="rounded-lg bg-sky-950 px-3 py-2 text-xs font-semibold text-white disabled:bg-slate-100 disabled:text-slate-400"
        >
          {t("payments.register")}
        </button>
        <button
          onClick={() => setSelected({ row, history: true })}
          aria-label={t("payments.historyFor", { name: row.student.fullName })}
          title={t("payments.history")}
          className="rounded-lg border border-slate-200 p-2 text-sky-800"
        >
          <History size={17} />
        </button>
      </div>
    );
  }
  if (loading)
    return (
      <p role="status" className="py-8">
        {t("payments.loading")}
      </p>
    );
  if (error || !data)
    return (
      <div role="alert" className="rounded-2xl bg-white p-6">
        <p>{t("payments.loadError")}</p>
        <button className="primary-button mt-4" onClick={refresh}>
          {t("dashboard.retry")}
        </button>
      </div>
    );
  return (
    <>
      <div className="mt-6 flex justify-end">
        <button
          className="primary-button"
          onClick={() => {
            setSuccess(false);
            setEnrolled(false);
            setEnrolling(true);
          }}
        >
          <Plus size={18} />
          {t("cycleDetail.enroll")}
        </button>
      </div>
      {enrolled && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-emerald-50 p-3 text-emerald-800"
        >
          {t("cycleDetail.enrolled")}
        </p>
      )}
      {enrolling && (
        <EnrollFromPayments
          cycleId={cycleId}
          onClose={() => setEnrolling(false)}
          onCreated={() => {
            setEnrolling(false);
            setEnrolled(true);
            refresh();
          }}
        />
      )}
      <div className="my-8 grid gap-4 sm:grid-cols-3">
        {[
          ["totalDue", data.totals.amountDue],
          ["totalPaid", data.totals.amountPaid],
          ["balance", data.totals.balance],
        ].map(([label, value]) => (
          <section
            key={label}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
          >
            <Wallet size={23} className="mb-4 text-cyan-600" />
            <h2 className="text-sm text-slate-500">{t(`payments.${label}`)}</h2>
            <p className="mt-2 break-words text-3xl font-bold text-sky-950">
              {money(value)}
            </p>
          </section>
        ))}
      </div>
      {success && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-800"
        >
          {t("payments.success")}
        </p>
      )}
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-5 text-xl font-semibold text-sky-950">
          {t("payments.enrollments")}
        </h2>
        {data.rows.length === 0 ? (
          <p className="py-6 text-center text-slate-500">
            {t("payments.empty")}
          </p>
        ) : (
          <>
            <div className="hidden xl:block">
              <table className="w-full table-fixed text-left text-sm">
                <thead>
                  <tr>
                    {[...columns, "payments.action"].map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className="border-b px-2 py-3 font-medium text-slate-500"
                      >
                        {t(label)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      {values(row).map((value, i) => (
                        <td key={columns[i]} className="break-words px-2 py-4">
                          {value}
                        </td>
                      ))}
                      <td className="px-2 py-4">{actions(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="grid gap-4 md:grid-cols-2 xl:hidden">
              {data.rows.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-slate-100 p-4"
                >
                  <h3 className="break-words font-semibold text-sky-950">
                    {row.student.fullName}
                  </h3>
                  <dl className="my-4 space-y-2">
                    {values(row)
                      .slice(1)
                      .map((value, i) => (
                        <div
                          key={columns[i + 1]}
                          className="flex justify-between gap-4 text-sm"
                        >
                          <dt className="text-slate-500">
                            {t(columns[i + 1])}
                          </dt>
                          <dd className="min-w-0 break-words text-right">
                            {value}
                          </dd>
                        </div>
                      ))}
                  </dl>
                  {actions(row)}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      {selected &&
        (selected.history ? (
          <PaymentHistory
            row={selected.row}
            onClose={() => setSelected(null)}
          />
        ) : (
          <RegisterPayment
            row={selected.row}
            onClose={() => setSelected(null)}
            onSaved={() => {
              setSuccess(true);
              refresh();
            }}
          />
        ))}
    </>
  );
}
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
              <CycleBalances key={cycleId} cycleId={cycleId} />
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
