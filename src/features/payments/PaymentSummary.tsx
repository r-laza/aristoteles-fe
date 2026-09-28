import { Wallet, CircleCheck, GraduationCap, CalendarDays } from "lucide-react";
import { t } from "../../lib/i18n";
import type { Balances } from "../../services/payments.api";
import { money } from "./formatting";
import { pendingFor } from "./paymentView";

export function PaymentSummary({ data }: { data: Balances }) {
  const cards = [
    { label: "totalDue", amount: data.totals.balance, icon: Wallet },
    { label: "totalPaid", amount: data.totals.amountPaid, icon: CircleCheck },
    {
      label: "enrollmentPending",
      amount: pendingFor(data.rows, "ENROLLMENT"),
      icon: GraduationCap,
    },
    {
      label: "pensionPending",
      amount: pendingFor(data.rows, "PENSION"),
      icon: CalendarDays,
    },
  ];
  return (
    <div className="my-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, amount, icon: Icon }) => (
        <section
          key={label}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="pt-1 text-sm font-medium text-slate-500">
              {t(`payments.${label}`)}
            </h2>
            <span className="rounded-xl bg-slate-50 p-2 text-sky-800">
              <Icon size={19} aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 break-words text-2xl font-semibold tracking-tight text-sky-950 tabular-nums">
            {money(amount)}
          </p>
        </section>
      ))}
    </div>
  );
}
