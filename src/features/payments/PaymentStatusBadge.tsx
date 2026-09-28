import { t } from "../../lib/i18n";
import type { PaymentStatus } from "../../services/payments.api";

const tones = {
  PAID: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  PARTIAL: "bg-amber-100 text-amber-900 ring-amber-600/25",
  PENDING: "bg-red-50 text-red-700 ring-red-600/20",
  OVERDUE: "bg-red-700 text-white ring-red-800/20",
  NA: "bg-slate-100 text-slate-500 ring-slate-500/10",
};
export function PaymentStatusBadge({
  status,
  account = false,
  prominent = false,
}: {
  status: PaymentStatus | null;
  account?: boolean;
  prominent?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full ring-1 ring-inset ${prominent ? "px-3 py-1.5 text-xs font-bold shadow-sm" : "px-2 py-0.5 text-[11px] font-medium"} ${tones[status ?? "NA"]}`}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-current"
      />
      {t(
        account
          ? `payments.accountStatus.${status ?? "NA"}`
          : status
            ? `payments.status.${status}`
            : "payments.notApplicable",
      )}
    </span>
  );
}
