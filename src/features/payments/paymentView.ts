import type {
  Obligation,
  PaymentRow,
  PaymentStatus,
  PaymentType,
} from "../../services/payments.api";

export type PaymentFiltersValue = {
  search: string;
  branch: string;
  group: string;
  type: string;
  status: string;
  month: string;
};
export const emptyFilters: PaymentFiltersValue = {
  search: "",
  branch: "",
  group: "",
  type: "",
  status: "",
  month: "",
};

// Sum the server's obligation balances in cents; never recompute fees or discounts.
export function sumAmounts(
  charges: Obligation[],
  field: "amountPaid" | "balance",
) {
  return (
    charges.reduce((sum, c) => sum + Math.round(Number(c[field]) * 100), 0) /
    100
  ).toFixed(2);
}
export function scopedCharges(row: PaymentRow, filters: PaymentFiltersValue) {
  return row.obligations.filter(
    (c) =>
      (!filters.type || c.paymentType === filters.type) &&
      (!filters.month ||
        c.paymentType === "ENROLLMENT" ||
        c.period === filters.month),
  );
}
export function obligationStatus(charges: Obligation[]): PaymentStatus | null {
  if (!charges.length) return null;
  if (charges.every((c) => Number(c.balance) === 0)) return "PAID";
  if (charges.some((c) => c.status === "OVERDUE")) return "OVERDUE";
  return charges.some((c) => Number(c.amountPaid) > 0) ? "PARTIAL" : "PENDING";
}
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
export function filterPaymentRows(
  rows: PaymentRow[],
  filters: PaymentFiltersValue,
) {
  return rows.filter((row) => {
    const charges = scopedCharges(row, filters);
    return (
      normalize(row.student.fullName).includes(normalize(filters.search)) &&
      (!filters.branch || String(row.branch.id) === filters.branch) &&
      (!filters.group || String(row.group.id) === filters.group) &&
      (charges.length > 0 || (!filters.type && !filters.month)) &&
      (!filters.status ||
        (row.status ?? "NA") === filters.status)
    );
  });
}
export function pendingFor(rows: PaymentRow[], type: PaymentType) {
  return sumAmounts(
    rows.flatMap((row) =>
      row.obligations.filter((c) => c.paymentType === type),
    ),
    "balance",
  );
}

// Account-level status shared with the server. Overdue debt has priority,
// followed by partial payments and then fully unpaid obligations in the window.
export function accountStatus(
  charges: Obligation[],
  today: string,
  warningDays = 7,
): PaymentStatus | null {
  if (!charges.some((c) => Number(c.amountDue) > 0)) return null;
  const pending = charges.filter((c) => Number(c.balance) > 0);
  if (!pending.length) return "PAID";
  if (pending.some((c) => c.dueDate && c.dueDate < today)) return "OVERDUE";
  if (pending.some((c) => Number(c.amountPaid) > 0)) return "PARTIAL";
  const warningThrough = new Date(`${today}T00:00:00Z`);
  warningThrough.setUTCDate(warningThrough.getUTCDate() + warningDays);
  const boundary = warningThrough.toISOString().slice(0, 10);
  return pending.some((c) => !c.dueDate || c.dueDate <= boundary)
    ? "PENDING"
    : "PAID";
}
export function pensionSummary(row: PaymentRow, today: string) {
  const installments = row.obligations.filter(
    (c) => c.paymentType === "PENSION",
  );
  return {
    installments,
    paid: installments.filter((c) => Number(c.balance) === 0).length,
    next: installments.find((c) => Number(c.balance) > 0),
    status: accountStatus(installments, today),
  };
}
