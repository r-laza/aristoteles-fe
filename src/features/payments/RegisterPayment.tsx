import { useMemo, useState, type FormEvent } from "react";
import { t } from "../../lib/i18n";
import { todayKey } from "../cycles/cycles";
import {
  paymentsApi,
  methods,
  type Obligation,
  type PaymentRegistration,
  type PaymentRow,
  type ReceiptDocumentType,
  type ReceiptRelationship,
} from "../../services/payments.api";
import { ApiError } from "../../services/api";
import { money, periodLabel } from "./formatting";

const keyFor = (charge: Obligation) =>
  `${charge.paymentType}:${charge.period ?? "enrollment"}`;
const cents = (value: string) => Math.round(Number(value) * 100);
const sum = (charges: Obligation[], field: keyof Obligation) =>
  charges.reduce((total, charge) => total + cents(String(charge[field])), 0) /
  100;

export function RegisterPayment({
  row,
  onCancel,
  onSaved,
}: {
  row: PaymentRow;
  onCancel: () => void;
  onSaved: (registration: PaymentRegistration) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [documentType, setDocumentType] = useState<ReceiptDocumentType>(
    row.student.representativeDocumentType ?? "DNI",
  );
  const [payerRelationship, setPayerRelationship] =
    useState<ReceiptRelationship>(row.student.relationship);
  const [paymentMethod, setPaymentMethod] = useState<(typeof methods)[number]>(
    "CASH",
  );
  const pending = useMemo(
    () => row.obligations.filter((charge) => Number(charge.balance) > 0),
    [row.obligations],
  );
  const pensionCharges = pending.filter(
    (charge) => charge.paymentType === "PENSION",
  );
  const [selected, setSelected] = useState<string[]>(
    pending[0] ? [keyFor(pending[0])] : [],
  );
  const selectedCharges = pending.filter((charge) =>
    selected.includes(keyFor(charge)),
  );
  const totalBalance = sum(selectedCharges, "balance");
  const [amount, setAmount] = useState(totalBalance.toFixed(2));
  const multiple = selectedCharges.length > 1;

  const applySelection = (keys: string[]) => {
    setSelected(keys);
    setAmount(
      sum(
        pending.filter((charge) => keys.includes(keyFor(charge))),
        "balance",
      ).toFixed(2),
    );
  };

  const choose = (charge: Obligation) => {
    const key = keyFor(charge);
    setError("");
    if (charge.paymentType === "ENROLLMENT") {
      applySelection([key]);
      return;
    }
    const pensionsOnly = selected.filter((value) =>
      value.startsWith("PENSION:"),
    );
    applySelection(
      pensionsOnly.includes(key)
        ? pensionsOnly.filter((value) => value !== key)
        : [...pensionsOnly, key],
    );
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const amountNumber = Number(amount);
    if (
      selectedCharges.length === 0 ||
      !Number.isFinite(amountNumber) ||
      amountNumber <= 0 ||
      Math.round(amountNumber * 100) > Math.round(totalBalance * 100)
    ) {
      setError(t("payments.overpayment"));
      return;
    }
    if (
      multiple &&
      Math.round(amountNumber * 100) !== Math.round(totalBalance * 100)
    ) {
      setError(t("payments.multipleFullPayment"));
      return;
    }
    const first = selectedCharges[0];
    const payerName = String(data.get("payerName")).trim();
    const payerDocumentNumber = String(data.get("payerDocumentNumber")).trim();
    const payerRelationshipOther = String(
      data.get("payerRelationshipOther") ?? "",
    ).trim();
    const evidence = data.get("evidence");
    if (
      evidence instanceof File &&
      evidence.size > 0 &&
      (evidence.size > 5 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "application/pdf"].includes(
          evidence.type,
        ))
    ) {
      setError(t("payments.invalidEvidence"));
      return;
    }
    const validDocument =
      documentType === "DNI"
        ? /^\d{8}$/.test(payerDocumentNumber)
        : /^[A-Za-z0-9]{6,12}$/.test(payerDocumentNumber);
    if (!payerName || !validDocument) {
      setError(t("receipts.invalidPayerInformation"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const registration = await paymentsApi.register(row.id, {
        paymentType: first.paymentType,
        period: multiple ? null : first.period,
        ...(multiple
          ? { periods: selectedCharges.map((charge) => charge.period!) }
          : {}),
        amount,
        paymentDate: String(data.get("paymentDate")),
        paymentMethod,
        reference: String(data.get("reference") ?? "").trim(),
        notes: String(data.get("notes")).trim(),
        payerName,
        payerDocumentType: documentType,
        payerDocumentNumber,
        payerRelationship,
        payerRelationshipOther,
      });
      if (
        evidence instanceof File &&
        evidence.size > 0 &&
        registration.payments[0]
      ) {
        try {
          registration.payments[0] = await paymentsApi.uploadEvidence(
            registration.payments[0].id,
            evidence,
          );
        } catch {
          registration.evidenceUploadFailed = true;
        }
      }
      onSaved(registration);
    } catch (cause) {
      setError(
        t(
          cause instanceof ApiError && cause.status === 409
            ? "payments.obligationChanged"
            : "payments.saveError",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["student", row.student.fullName],
            ["cycle", row.cycle],
            ["group", row.group.name],
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
        <fieldset disabled={busy} className="mt-4 rounded-xl bg-slate-50 p-4">
          <legend className="text-sm font-semibold text-sky-950">
            {t("receipts.payerInformation")}
          </legend>
          <p className="mt-1 text-xs text-slate-500">
            {t("receipts.payerSnapshotHelp")}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="payer-name" className="field-label">
                {t("admin.representativeName")}
              </label>
              <input
                id="payer-name"
                name="payerName"
                required
                defaultValue={row.student.representativeName}
                className="field bg-white"
              />
            </div>
            <div>
              <label htmlFor="payer-document-type" className="field-label">
                {t("receipts.documentType")}
              </label>
              <select
                id="payer-document-type"
                name="payerDocumentType"
                value={documentType}
                onChange={(event) =>
                  setDocumentType(event.target.value as ReceiptDocumentType)
                }
                className="field bg-white"
              >
                {(["DNI", "CE", "PASSPORT"] as const).map((type) => (
                  <option key={type} value={type}>
                    {t(`receipts.documentTypes.${type}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="payer-document-number" className="field-label">
                {t("receipts.documentNumber")}
              </label>
              <input
                id="payer-document-number"
                name="payerDocumentNumber"
                required
                defaultValue={row.student.representativeDocumentNumber ?? ""}
                className="field bg-white"
              />
            </div>
            <div>
              <label htmlFor="payer-relationship" className="field-label">
                {t("receipts.relationshipPdf")}
              </label>
              <select
                id="payer-relationship"
                name="payerRelationship"
                value={payerRelationship}
                onChange={(event) =>
                  setPayerRelationship(
                    event.target.value as ReceiptRelationship,
                  )
                }
                className="field bg-white"
              >
                {(["FATHER", "MOTHER", "GUARDIAN", "OTHER"] as const).map(
                  (relationship) => (
                    <option key={relationship} value={relationship}>
                      {t(`receipts.relationships.${relationship}`)}
                    </option>
                  ),
                )}
              </select>
            </div>
            {payerRelationship === "OTHER" && (
              <div>
                <label
                  htmlFor="payer-relationship-other"
                  className="field-label"
                >
                  {t("receipts.relationshipOther")}
                </label>
                <input
                  id="payer-relationship-other"
                  name="payerRelationshipOther"
                  defaultValue={row.student.relationshipOther ?? ""}
                  maxLength={100}
                  className="field bg-white"
                />
              </div>
            )}
          </div>
        </fieldset>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(360px,0.8fr)] xl:gap-8">
        <fieldset
          disabled={busy}
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <legend className="field-label mb-0">
              {t("payments.selectObligation")}
            </legend>
            {pensionCharges.length > 1 && (
              <div className="flex gap-3 text-xs font-medium">
                <button
                  type="button"
                  className="text-sky-700 hover:text-sky-900"
                  onClick={() =>
                    applySelection(
                      pensionCharges.map((charge) => keyFor(charge)),
                    )
                  }
                >
                  {t("payments.selectAll")}
                </button>
                <button
                  type="button"
                  className="text-slate-500 hover:text-slate-800"
                  onClick={() => applySelection([])}
                >
                  {t("payments.clearSelection")}
                </button>
              </div>
            )}
          </div>
          {pending.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              {t("payments.noPendingInstallments")}
            </p>
          ) : (
            <div className="space-y-2 rounded-xl border border-slate-200 p-2">
              {pending.map((item) => {
                const key = keyFor(item);
                const checked = selected.includes(key);
                const hasDiscount = Number(item.discountAmount) > 0;
                return (
                  <label
                    key={key}
                    className={`block cursor-pointer rounded-lg border p-3 ${checked ? "border-sky-600 bg-sky-50" : "border-transparent hover:bg-slate-50"}`}
                  >
                    <span className="flex items-start gap-3">
                      <input
                        className="mt-1"
                        type={
                          item.paymentType === "PENSION" ? "checkbox" : "radio"
                        }
                        name="obligation"
                        value={key}
                        checked={checked}
                        onChange={() => choose(item)}
                      />
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="block font-medium text-sky-950">
                          {item.paymentType === "ENROLLMENT"
                            ? row.enrollmentFeeName
                            : (row.pensionName ?? t("payments.types.PENSION"))}
                        </span>
                        <span className="text-xs capitalize text-slate-500">
                          {item.period
                            ? periodLabel(item.period)
                            : t("payments.types.ENROLLMENT")}
                          {t("payments.periodDetail", {
                            period: t(`payments.status.${item.status}`),
                          })}
                        </span>
                      </span>
                      <span className="text-right text-xs text-slate-500">
                        {t("payments.balance")}
                        <strong className="block text-sm text-sky-950 tabular-nums">
                          {money(item.balance)}
                        </strong>
                      </span>
                    </span>
                    <span className="mt-3 grid gap-2 rounded-lg bg-white/70 p-2 text-xs text-slate-500 sm:grid-cols-3">
                      <span>
                        {t("payments.originalAmount")}
                        <strong className="block text-slate-700 tabular-nums">
                          {money(item.originalAmount)}
                        </strong>
                      </span>
                      <span>
                        {t("payments.discountApplied")}
                        <strong className="block text-slate-700 tabular-nums">
                          {hasDiscount
                            ? money(item.discountAmount)
                            : t("payments.noDiscount")}
                        </strong>
                      </span>
                      <span>
                        {t("payments.finalPendingAmount")}
                        <strong className="block text-slate-700 tabular-nums">
                          {money(item.balance)}
                        </strong>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>

        <fieldset
          disabled={busy}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 sm:p-6"
        >
          <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-4">
            <h3 className="font-semibold text-sky-950">
              {t("payments.paymentSummary")}
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <SummaryRow
                label={t("payments.selectedInstallments")}
                value={String(selectedCharges.length)}
              />
              <SummaryRow
                label={t("payments.originalSubtotal")}
                value={money(sum(selectedCharges, "originalAmount").toFixed(2))}
              />
              <SummaryRow
                label={t("payments.totalDiscount")}
                value={money(sum(selectedCharges, "discountAmount").toFixed(2))}
              />
              <SummaryRow
                label={t("payments.alreadyPaid")}
                value={money(sum(selectedCharges, "amountPaid").toFixed(2))}
              />
              <SummaryRow
                strong
                label={t("payments.totalToPay")}
                value={money(totalBalance.toFixed(2))}
              />
            </dl>
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
              max={totalBalance.toFixed(2)}
              step="0.01"
              required
              readOnly={multiple}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className={`field ${multiple ? "bg-slate-50" : ""}`}
            />
            {multiple && (
              <p className="mt-1 text-xs text-slate-500">
                {t("payments.multipleFullPaymentHelp")}
              </p>
            )}
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
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(
                    event.target.value as (typeof methods)[number],
                  )
                }
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
          {paymentMethod !== "CASH" && (
            <div>
              <label htmlFor="payment-reference" className="field-label">
                {t("payments.operationReference")}
              </label>
              <input
                id="payment-reference"
                name="reference"
                maxLength={200}
                className="field"
              />
            </div>
          )}
          <div>
            <label htmlFor="payment-evidence" className="field-label">
              {t("payments.attachEvidence")}
            </label>
            <input
              id="payment-evidence"
              name="evidence"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              className="field file:mr-3 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:font-semibold file:text-sky-800"
            />
            <p className="mt-1 text-xs text-slate-500">
              {t("payments.evidenceHelp")}
            </p>
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
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={onCancel}
              className="rounded-xl border px-4 py-2"
            >
              {t("admin.cancel")}
            </button>
            <button
              disabled={
                busy || selectedCharges.length === 0 || totalBalance <= 0
              }
              className="primary-button"
            >
              {t(busy ? "admin.saving" : "payments.register")}
            </button>
          </div>
        </fieldset>
      </div>
    </form>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 ${strong ? "border-t border-cyan-200 pt-2 font-bold text-sky-950" : "text-slate-600"}`}
    >
      <dt>{label}</dt>
      <dd className="shrink-0 tabular-nums">{value}</dd>
    </div>
  );
}
