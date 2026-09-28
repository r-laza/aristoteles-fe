import { useState, type FormEvent } from "react";
import { t } from "../../lib/i18n";
import { todayKey } from "../cycles/cycles";
import {
  paymentsApi,
  methods,
  type PaymentRow,
} from "../../services/payments.api";
import { ApiError } from "../../services/api";
import { PaymentDialog } from "./PaymentDialog";
import { money, periodLabel } from "./formatting";
export function RegisterPayment({
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
  const pending = row.obligations.filter((c) => Number(c.balance) > 0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const charge = pending[selectedIndex];
  const paymentType = charge?.paymentType;
  const period = charge?.period;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const amount = String(data.get("amount"));
    if (
      !charge ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      Math.round(Number(amount) * 100) >
        Math.round(Number(charge.balance) * 100)
    ) {
      setError(t("payments.overpayment"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await paymentsApi.register(row.id, {
        paymentType: charge.paymentType,
        period: charge.period,
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
    <PaymentDialog title={t("payments.register")} busy={busy} onClose={onClose}>
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <fieldset disabled={busy} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["student", row.student.fullName],
              ["cycle", row.cycle],
              ["group", row.group.name],
              ["balance", money(charge?.balance ?? "0")],
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
          <fieldset className="space-y-3">
            <legend className="field-label">
              {t("payments.selectObligation")}
            </legend>
            <div className="max-h-60 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {pending.map((item, index) => (
                <label
                  key={`${item.paymentType}-${item.period}`}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${selectedIndex === index ? "border-sky-600 bg-sky-50" : "border-transparent hover:bg-slate-50"}`}
                >
                  <input
                    type="radio"
                    name="obligation"
                    value={index}
                    checked={selectedIndex === index}
                    onChange={() => {
                      setSelectedIndex(index);
                      setError("");
                    }}
                  />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block font-medium">
                      {item.paymentType === "ENROLLMENT"
                        ? row.enrollmentFeeName
                        : (row.pensionName ?? t("payments.types.PENSION"))}
                    </span>
                    <span className="text-xs text-slate-500">
                      {item.period
                        ? periodLabel(item.period)
                        : t("payments.types.ENROLLMENT")}
                    </span>
                  </span>
                  <span className="text-right text-xs text-slate-500">
                    {t("payments.balance")}
                    <strong className="block text-sm text-sky-950 tabular-nums">
                      {money(item.balance)}
                    </strong>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
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
              key={`${paymentType}-${period}`}
              max={charge?.balance ?? "0"}
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
          <button
            disabled={busy || !charge || Number(charge.balance) <= 0}
            className="primary-button"
          >
            {t(busy ? "admin.saving" : "payments.register")}
          </button>
        </div>
      </form>
    </PaymentDialog>
  );
}
