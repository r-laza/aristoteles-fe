import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { t } from "../../lib/i18n";
import { formatCycleDate } from "../cycles/cycles";
import {
  paymentsApi,
  type PaymentRow,
  type Payment,
} from "../../services/payments.api";
import { PaymentDialog } from "./PaymentDialog";
import { money, periodLabel } from "./formatting";
import { ReceiptDialog } from "./ReceiptDialog";
import { downloadReceiptPdf } from "./receiptPdf";
export function PaymentHistory({
  row,
  onClose,
}: {
  row: PaymentRow;
  onClose: () => void;
}) {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [error, setError] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [receiptMessage, setReceiptMessage] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
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

  async function downloadReceipt(payment: Payment) {
    setDownloadingId(payment.id);
    setReceiptMessage("");
    try {
      await downloadReceiptPdf(await paymentsApi.receipt(payment.id));
    } catch {
      setReceiptMessage(t("receipts.downloadError"));
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <PaymentDialog title={t("payments.history")} onClose={onClose}>
      <p className="mb-4 break-words font-medium text-sky-950">
        {row.student.fullName}
      </p>
      {receiptMessage && (
        <p
          role="status"
          className={`mb-4 rounded-xl px-4 py-3 text-sm ${receiptMessage === t("receipts.generated") ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}
        >
          {receiptMessage}
        </p>
      )}
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
                {t(`payments.types.${payment.paymentType}`)}
                {payment.period &&
                  t("payments.periodDetail", {
                    period: periodLabel(payment.period),
                  })}
              </p>
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
              <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
                {payment.receiptNumber ? (
                  <button
                    type="button"
                    disabled={downloadingId === payment.id}
                    onClick={() => void downloadReceipt(payment)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-sky-800 hover:text-sky-950 disabled:opacity-60"
                  >
                    <Download size={16} aria-hidden="true" />
                    {t("receipts.download")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptMessage("");
                      setReceiptPayment(payment);
                    }}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-sky-800 hover:text-sky-950"
                  >
                    <FileText size={16} aria-hidden="true" />
                    {t("receipts.generate")}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      {receiptPayment && (
        <ReceiptDialog
          payment={receiptPayment}
          onClose={() => setReceiptPayment(null)}
          onGenerated={async (receipt) => {
            await downloadReceiptPdf(receipt);
            setPayments(
              (current) =>
                current?.map((payment) =>
                  payment.id === receipt.paymentId
                    ? { ...payment, receiptNumber: receipt.receiptNumber }
                    : payment,
                ) ?? null,
            );
            setReceiptPayment(null);
            setReceiptMessage(t("receipts.generated"));
          }}
        />
      )}
    </PaymentDialog>
  );
}
