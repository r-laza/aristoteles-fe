import { Wallet } from "lucide-react";
import { t } from "../../lib/i18n";
import { todayKey } from "../cycles/cycles";
import type { PaymentRow } from "../../services/payments.api";
import { money, periodLabel } from "./formatting";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { accountStatus, pensionSummary } from "./paymentView";

type Props = {
  rows: PaymentRow[];
  onRegister: (row: PaymentRow) => void;
};
function EnrollmentCell({ row }: { row: PaymentRow }) {
  const charge = row.obligations.find((c) => c.paymentType === "ENROLLMENT");
  if (!charge) return <PaymentStatusBadge status={null} />;
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
        <p className="min-w-0 break-words font-semibold text-sky-950">
          {row.enrollmentFeeName}
        </p>
        <span aria-hidden="true" className="text-slate-400">
          {t("payments.inlineSeparator")}
        </span>
        <p className="shrink-0 text-right text-sm font-semibold text-slate-700 tabular-nums">
          {money(charge.amountDue)}
        </p>
      </div>
      <p className="text-xs leading-5 text-slate-500 tabular-nums">
        {t("payments.compactEnrollmentBalance", {
          paid: money(charge.amountPaid),
          balance: money(charge.balance),
        })}
      </p>
      <PaymentStatusBadge status={charge.status} />
    </div>
  );
}
function PensionCell({ row }: { row: PaymentRow }) {
  const summary = pensionSummary(row, todayKey());
  if (!summary.installments.length) return <PaymentStatusBadge status={null} />;
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
        <p className="min-w-0 break-words font-semibold text-sky-950">
          {row.pensionName ?? t("payments.types.PENSION")}
        </p>
        <span aria-hidden="true" className="text-slate-400">
          {t("payments.inlineSeparator")}
        </span>
        <p className="shrink-0 text-right text-sm font-semibold text-slate-700 tabular-nums">
          {t("payments.monthlyAmount", {
            amount: money(
              row.pensionMonthlyAmount ?? summary.installments[0].amountDue,
            ),
          })}
        </p>
      </div>
      <p className="text-xs text-slate-500">
        {t("payments.installmentsPaid", {
          paid: summary.paid,
          total: summary.installments.length,
        })}
      </p>
      <p className="text-xs text-slate-500">
        {summary.next?.period
          ? t("payments.nextInstallment", {
              period: periodLabel(summary.next.period),
            })
          : t("payments.allInstallmentsPaid")}
      </p>
      <PaymentStatusBadge
        status={summary.status}
        account={summary.status === "PAID"}
      />
    </div>
  );
}
function StudentIdentity({ row }: { row: PaymentRow }) {
  return (
    <div className="min-w-0">
      <p className="break-words font-bold text-sky-950">
        {row.student.fullName}
      </p>
      <p className="mt-1 break-words text-xs text-slate-400">
        {row.student.dni}
      </p>
    </div>
  );
}
function PaymentActions({
  row,
  onRegister,
}: Pick<Props, "onRegister"> & { row: PaymentRow }) {
  return (
    <div className="flex flex-nowrap items-center justify-center gap-2">
      <button
        onClick={() => onRegister(row)}
        className="primary-button shrink-0 whitespace-nowrap !gap-1 !rounded-lg !px-2 !py-2 !text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
      >
        <Wallet size={15} className="shrink-0" aria-hidden="true" />
        {t("payments.manage")}
      </button>
    </div>
  );
}

export function PaymentsTable({ rows, onRegister }: Props) {
  const columns = [
    "student",
    "group",
    "types.ENROLLMENT",
    "pensions",
    "totalBalance",
    "overallStatus",
    "action",
  ];
  return (
    <>
      <div
        className="grid gap-4 lg:hidden"
        aria-label={t("payments.enrollments")}
      >
        {rows.map((row) => (
          <article
            key={row.id}
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <header className="flex min-w-0 items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <StudentIdentity row={row} />
              <span className="max-w-[45%] shrink-0 break-words rounded-lg bg-slate-50 px-2.5 py-1 text-right text-xs font-medium text-slate-600">
                {t("payments.group")}: {row.group.name}
              </span>
            </header>

            <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
              <section className="min-w-0 rounded-xl bg-slate-50 p-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("payments.types.ENROLLMENT")}
                </h3>
                <EnrollmentCell row={row} />
              </section>
              <section className="min-w-0 rounded-xl bg-slate-50 p-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("payments.pensions")}
                </h3>
                <PensionCell row={row} />
              </section>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              <div className="min-w-0">
                <dt className="text-xs text-slate-500">
                  {t("payments.totalBalance")}
                </dt>
                <dd className="mt-1 break-words font-bold text-sky-950 tabular-nums">
                  {money(row.balance)}
                </dd>
              </div>
              <div className="min-w-0 text-right">
                <dt className="mb-1 text-xs text-slate-500">
                  {t("payments.overallStatus")}
                </dt>
                <dd className="flex justify-end">
                  <PaymentStatusBadge
                    prominent
                    status={accountStatus(row.obligations, todayKey())}
                    account
                  />
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={() => onRegister(row)}
              className="primary-button mt-4 min-h-12 w-full"
            >
              <Wallet size={17} aria-hidden="true" />
              {t("payments.manage")}
            </button>
          </article>
        ))}
      </div>

      <div
        className="hidden overflow-x-auto lg:block"
        tabIndex={0}
        role="region"
        aria-label={t("payments.enrollments")}
      >
        <table className="w-full min-w-[1440px] table-fixed text-left text-sm">
          <caption className="sr-only">{t("payments.enrollments")}</caption>
          <colgroup>
            <col className="w-[14%]" />
            <col className="w-[8%]" />
            <col className="w-[22%]" />
            <col className="w-[24%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead className="border-b border-slate-200/70 bg-slate-50/80">
            <tr>
              {columns.map((key) => (
                <th
                  key={key}
                  scope="col"
                  className={`h-11 ${key === "action" ? "px-2" : "px-4"} py-2 text-xs font-semibold text-slate-500 ${key === "totalBalance" ? "text-right" : key === "action" ? "text-center" : ""}`}
                >
                  {t(`payments.${key}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="align-middle transition-colors hover:bg-sky-50/40"
              >
                <td className="px-4 py-4">
                  <StudentIdentity row={row} />
                </td>
                <td className="break-words px-4 py-4 text-xs text-slate-500">
                  {row.group.name}
                </td>
                <td className="px-4 py-4">
                  <EnrollmentCell row={row} />
                </td>
                <td className="px-4 py-4">
                  <PensionCell row={row} />
                </td>
                <td className="whitespace-nowrap px-4 py-4 align-middle text-right font-bold text-sky-950 tabular-nums">
                  {money(row.balance)}
                </td>
                <td className="px-4 py-4 align-middle">
                  <PaymentStatusBadge
                    prominent
                    status={accountStatus(row.obligations, todayKey())}
                    account
                  />
                </td>
                <td className="px-2 py-4 align-middle">
                  <PaymentActions row={row} onRegister={onRegister} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
