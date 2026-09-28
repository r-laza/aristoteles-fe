import { useEffect, useState } from "react";
import { t } from "../../lib/i18n";
import { formatCycleDate } from "../cycles/cycles";
import {
  paymentsApi,
  type PaymentRow,
  type Payment,
} from "../../services/payments.api";
import { PaymentDialog } from "./PaymentDialog";
import { money, periodLabel } from "./formatting";
export function PaymentHistory({
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
    <PaymentDialog title={t("payments.history")} onClose={onClose}>
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
            </li>
          ))}
        </ol>
      )}
    </PaymentDialog>
  );
}
