import { Wallet } from "lucide-react";
import { t } from "../../lib/i18n";
import type { PaymentRow } from "../../services/payments.api";
import { money } from "./formatting";
import { PaymentStatusBadge } from "./PaymentStatusBadge";

type Props = { rows: PaymentRow[]; onRegister: (row: PaymentRow) => void };
export function PaymentsTable({ rows, onRegister }: Props) {
  return (
    <>
      <div
        className="grid gap-4 p-4 lg:hidden"
        aria-label={t("payments.enrollments")}
      >
        {rows.map((row) => (
          <article
            key={row.student.id}
            className="rounded-2xl border border-slate-200 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-sky-950">
                  {row.student.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  DNI {row.student.dni} · {row.group.name}
                </p>
              </div>
              <PaymentStatusBadge prominent status={row.status} account />
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <Amount label={t("payments.totalPaid")} value={row.amountPaid} />
              <Amount label={t("payments.totalBalance")} value={row.balance} />
              <Amount
                label={t("payments.overdueBalance")}
                value={row.overdueBalance}
                danger
              />
            </dl>
            <div className="mt-4">
              <Action row={row} onClick={onRegister} />
            </div>
          </article>
        ))}
      </div>
      <div
        className="hidden overflow-x-auto lg:block"
        tabIndex={0}
        role="region"
        aria-label={t("payments.enrollments")}
      >
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              {[
                "student",
                "action",
                "group",
                "totalPaid",
                "totalBalance",
                "overdueBalance",
                "overallStatus",
              ].map((key) => (
                <th
                  key={key}
                  className={`px-4 py-3 ${key === "action" ? "text-center" : ""}`}
                >
                  {t(`payments.${key}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.student.id} className="hover:bg-sky-50/40">
                <td className="px-4 py-4">
                  <strong className="text-sky-950">
                    {row.student.fullName}
                  </strong>
                  <div className="text-xs text-slate-500">
                    DNI {row.student.dni}
                  </div>
                </td>
                <td className="px-4 py-4 text-center align-middle">
                  <div className="flex items-center justify-center [&>button]:w-auto">
                    <Action row={row} onClick={onRegister} />
                  </div>
                </td>
                <td className="px-4 py-4">{row.group.name}</td>
                <td className="px-4 py-4 font-semibold tabular-nums">
                  {money(row.amountPaid)}
                </td>
                <td className="px-4 py-4 font-semibold tabular-nums">
                  {money(row.balance)}
                </td>
                <td className="px-4 py-4 font-semibold text-red-700 tabular-nums">
                  {money(row.overdueBalance)}
                </td>
                <td className="px-4 py-4">
                  <PaymentStatusBadge prominent status={row.status} account />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function Amount({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd
        className={`mt-1 font-bold tabular-nums ${danger ? "text-red-700" : "text-sky-950"}`}
      >
        {money(value)}
      </dd>
    </div>
  );
}
function Action({
  row,
  onClick,
}: {
  row: PaymentRow;
  onClick: (row: PaymentRow) => void;
}) {
  return <ManagePaymentsButton onClick={() => onClick(row)} />;
}
export function ManagePaymentsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="primary-button min-h-10 w-full justify-center whitespace-nowrap !px-3 !text-xs lg:w-auto"
    >
      <Wallet size={15} aria-hidden="true" />
      {t("payments.manage")}
    </button>
  );
}
