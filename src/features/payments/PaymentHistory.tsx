import { useEffect, useState } from "react";
import { Download, Eye, FilePlus2, Paperclip } from "lucide-react";
import { t } from "../../lib/i18n";
import { formatCycleDate } from "../cycles/cycles";
import {
  paymentsApi,
  type Payment,
  type PaymentRow,
} from "../../services/payments.api";
import { money, periodLabel } from "./formatting";
import { ReceiptDialog } from "./ReceiptDialog";
import { downloadReceiptPdf, viewReceiptPdf } from "./receiptPdf";

export function PaymentHistory({ row }: { row: PaymentRow }) {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [error, setError] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    paymentsApi
      .history(row.id)
      .then((result) => {
        if (!cancelled) setPayments(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [row.id]);

  async function handleReceipt(payment: Payment, mode: "view" | "download") {
    setBusyId(payment.id);
    setMessage("");
    try {
      const receipt = await paymentsApi.receipt(payment.id);
      if (mode === "view") await viewReceiptPdf(receipt);
      else await downloadReceiptPdf(receipt);
    } catch {
      setMessage(t("receipts.downloadError"));
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <p role="alert">{t("payments.historyLoadError")}</p>;
  if (!payments) return <p role="status">{t("payments.loading")}</p>;
  if (payments.length === 0)
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        {t("payments.noHistory")}
      </p>
    );

  return (
    <>
      {message && (
        <p role="alert" className="mb-4 text-sm text-red-700">
          {message}
        </p>
      )}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                {[
                  "historyDate",
                  "historyConcept",
                  "historyAmount",
                  "method",
                  "receiptNumber",
                  "actions",
                ].map((key) => (
                  <th key={key} className="px-4 py-3">
                    {t(`payments.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatCycleDate(payment.paymentDate.slice(0, 10))}
                  </td>
                  <td className="px-4 py-3">
                    {t(`payments.types.${payment.paymentType}`)}
                    {payment.period ? ` · ${periodLabel(payment.period)}` : ""}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums">
                    {money(payment.amount)}
                  </td>
                  <td className="px-4 py-3">
                    {t(`payments.methods.${payment.paymentMethod}`)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {payment.receiptNumber ?? t("admin.unavailable")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {payment.receiptNumber ? (
                        <>
                          <button
                            type="button"
                            disabled={busyId === payment.id}
                            onClick={() => void handleReceipt(payment, "view")}
                            aria-label={t("receipts.viewNumber", {
                              number: payment.receiptNumber,
                            })}
                            className="rounded-lg p-2 text-sky-700 hover:bg-sky-50 disabled:opacity-50"
                          >
                            <Eye size={18} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            disabled={busyId === payment.id}
                            onClick={() =>
                              void handleReceipt(payment, "download")
                            }
                            aria-label={t("receipts.downloadNumber", {
                              number: payment.receiptNumber,
                            })}
                            className="rounded-lg p-2 text-sky-700 hover:bg-sky-50 disabled:opacity-50"
                          >
                            <Download size={18} aria-hidden="true" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReceiptPayment(payment)}
                          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 font-semibold text-sky-700 hover:bg-sky-50"
                        >
                          <FilePlus2 size={18} aria-hidden="true" />
                          {t("receipts.generate")}
                        </button>
                      )}
                      {payment.paymentEvidenceKey && (
                        <>
                          <a
                            href={paymentsApi.evidenceUrl(payment.id)}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={t("payments.viewEvidence")}
                            title={t("payments.viewEvidence")}
                            className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50"
                          >
                            <Paperclip size={18} aria-hidden="true" />
                          </a>
                          <a
                            href={paymentsApi.evidenceUrl(payment.id, true)}
                            aria-label={t("payments.downloadEvidence")}
                            title={t("payments.downloadEvidence")}
                            className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50"
                          >
                            <Download size={18} aria-hidden="true" />
                          </a>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {receiptPayment && (
        <ReceiptDialog
          payment={receiptPayment}
          defaultPayer={{
            name:
              receiptPayment.payerName ?? row.student.representativeName ?? "",
            documentType:
              receiptPayment.payerDocumentType ??
              row.student.representativeDocumentType,
            documentNumber:
              receiptPayment.payerDocumentNumber ??
              row.student.representativeDocumentNumber,
            relationship:
              receiptPayment.payerRelationship ?? row.student.relationship,
            relationshipOther:
              receiptPayment.payerRelationship === "OTHER"
                ? receiptPayment.payerRelationshipOther
                : receiptPayment.payerRelationship
                  ? null
                  : row.student.relationshipOther,
          }}
          onClose={() => setReceiptPayment(null)}
          onGenerated={(receipt) => {
            setPayments((current) =>
              current
                ? current.map((payment) =>
                    payment.id === receipt.paymentId
                      ? { ...payment, receiptNumber: receipt.receiptNumber }
                      : payment,
                  )
                : current,
            );
            setReceiptPayment(null);
            setMessage(t("receipts.generated"));
          }}
        />
      )}
    </>
  );
}
