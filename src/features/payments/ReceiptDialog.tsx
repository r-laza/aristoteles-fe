import { useState, type FormEvent } from "react";
import { t } from "../../lib/i18n";
import {
  paymentsApi,
  type Payment,
  type PaymentReceipt,
  type ReceiptDocumentType,
  type ReceiptRelationship,
} from "../../services/payments.api";
import { PaymentDialog } from "./PaymentDialog";

const documentTypes: ReceiptDocumentType[] = ["DNI", "CE", "PASSPORT"];
const relationships: ReceiptRelationship[] = [
  "FATHER",
  "MOTHER",
  "GUARDIAN",
  "OTHER",
];

export function ReceiptDialog({
  payment,
  onClose,
  onGenerated,
}: {
  payment: Payment;
  onClose: () => void;
  onGenerated: (receipt: PaymentReceipt) => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [documentType, setDocumentType] = useState<ReceiptDocumentType>("DNI");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const payerName = String(data.get("payerName")).trim();
    const payerDocumentNumber = String(data.get("payerDocumentNumber")).trim();
    const payerRelationship = String(data.get("payerRelationship")) as
      ReceiptRelationship | "";
    if (!payerName || !documentType || !payerDocumentNumber) {
      setError(t("receipts.requiredFields"));
      return;
    }
    const validDocument =
      documentType === "DNI"
        ? /^\d{8}$/.test(payerDocumentNumber)
        : /^[A-Za-z0-9]{6,12}$/.test(payerDocumentNumber);
    if (!validDocument) {
      setError(t("receipts.invalidDocument"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onGenerated(
        await paymentsApi.createReceipt(payment.id, {
          payerName,
          payerDocumentType: documentType,
          payerDocumentNumber,
          payerRelationship,
        }),
      );
    } catch {
      setError(t("receipts.generateError"));
      setBusy(false);
    }
  }

  return (
    <PaymentDialog title={t("receipts.title")} busy={busy} onClose={onClose}>
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <fieldset disabled={busy} className="space-y-4">
          <h3 className="font-semibold text-sky-950">
            {t("receipts.payerInformation")}
          </h3>
          <div>
            <label htmlFor="receipt-document-type" className="field-label">
              {t("receipts.documentType")}
            </label>
            <select
              id="receipt-document-type"
              name="payerDocumentType"
              required
              value={documentType}
              onChange={(event) => {
                setDocumentType(event.target.value as ReceiptDocumentType);
                setError("");
              }}
              className="field"
            >
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`receipts.documentTypes.${type}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="receipt-document-number" className="field-label">
              {t("receipts.documentNumber")}
            </label>
            <input
              id="receipt-document-number"
              name="payerDocumentNumber"
              maxLength={30}
              required
              className="field"
            />
          </div>
          <div>
            <label htmlFor="receipt-payer-name" className="field-label">
              {t("receipts.fullName")}
            </label>
            <input
              id="receipt-payer-name"
              name="payerName"
              maxLength={150}
              required
              className="field"
            />
          </div>
          <div>
            <label htmlFor="receipt-relationship" className="field-label">
              {t("receipts.relationship")}
            </label>
            <select
              id="receipt-relationship"
              name="payerRelationship"
              className="field"
            >
              <option value="">{t("receipts.selectOption")}</option>
              {relationships.map((relationship) => (
                <option key={relationship} value={relationship}>
                  {t(`receipts.relationships.${relationship}`)}
                </option>
              ))}
            </select>
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
            {t(busy ? "receipts.generating" : "receipts.generatePdf")}
          </button>
        </div>
      </form>
    </PaymentDialog>
  );
}
