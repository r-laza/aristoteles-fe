import type {
  AcademicCycle,
  AvailableStudent,
  CycleGroup,
} from "../cycles/cycles";
import type {
  EnrollmentPaymentDraft,
  Obligation,
} from "../../services/payments.api";

export const ENROLLMENT_DRAFT_KEY = "aristoteles.enrollmentPaymentDraft";

const decimal = (cents: number) => (cents / 100).toFixed(2);

function months(start: string, end: string) {
  const values: string[] = [];
  const cursor = new Date(`${start.slice(0, 7)}-01T00:00:00.000Z`);
  const last = end.slice(0, 7);
  while (cursor.toISOString().slice(0, 7) <= last) {
    values.push(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return values;
}

export function createEnrollmentPaymentDraft(
  cycle: AcademicCycle,
  group: CycleGroup,
  student: AvailableStudent,
  pensionDiscountAmount: string,
  discountReason: string,
  installments: number,
  dueRule: "FIFTEENTH" | "LAST_DAY",
): EnrollmentPaymentDraft {
  const baseCents = Math.round(Number(group.pension!.amount) * 100);
  const discountCents = Math.round(Number(pensionDiscountAmount || 0) * 100);
  const payableCents = baseCents - discountCents;
  const obligations: Obligation[] = [];
  if (cycle.category === "SCHOOL" && cycle.fee) {
    obligations.push(obligation("ENROLLMENT", null, Number(cycle.fee.amount), 0, null));
    for (const period of months(cycle.startDate, cycle.endDate)) {
      const [year, month] = period.split("-").map(Number);
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      obligations.push(obligation("PENSION", period, baseCents / 100, discountCents / 100, `${period}-${String(Math.min(group.pension!.dueDay, lastDay)).padStart(2, "0")}`));
    }
  } else {
    const quotient = Math.floor(payableCents / installments);
    const remainder = payableCents % installments;
    const baseQuotient = Math.floor(baseCents / installments);
    const baseRemainder = baseCents % installments;
    let start = new Date(`${cycle.startDate}T00:00:00.000Z`);
    if (dueRule === "FIFTEENTH" && start.getUTCDate() > 15)
      start = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    for (let index = 0; index < installments; index += 1) {
      const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
      const period = cursor.toISOString().slice(0, 7);
      const original = baseQuotient + (index < baseRemainder ? 1 : 0);
      const final = quotient + (index < remainder ? 1 : 0);
      const day = dueRule === "FIFTEENTH" ? 15 : new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0)).getUTCDate();
      obligations.push(obligation("PENSION", period, original / 100, (original - final) / 100, `${period}-${String(day).padStart(2, "0")}`));
    }
  }
  const total = obligations.reduce((sum, item) => sum + Number(item.balance), 0).toFixed(2);
  return {
    cycleId: cycle.id,
    branchId: group.branch.id,
    groupId: group.id,
    enrollment: {
      studentId: student.id,
      branchId: group.branch.id,
      groupId: group.id,
      pensionDiscountAmount: decimal(discountCents),
      discountReason,
      ...(cycle.category === "PREUNIVERSITY" ? { preuniversityInstallments: installments, preuniversityDueRule: dueRule } : {}),
    },
    row: {
      id: 0,
      student,
      cycle: cycle.name,
      group: { id: group.id, name: group.name },
      branch: group.branch,
      enrollmentFeeName: cycle.category === "SCHOOL" ? (cycle.fee?.name ?? "") : "",
      pensionName: group.pension!.name,
      pensionMonthlyAmount: decimal(payableCents),
      baseAmount: cycle.category === "SCHOOL" ? (cycle.fee?.amount ?? "0.00") : "0.00",
      discountAmount: "0.00",
      obligations,
      amountDue: total,
      amountPaid: "0.00",
      balance: total,
      overdueBalance: "0.00",
      status: "PENDING",
      lastPaymentDate: null,
    },
  };
}

function obligation(paymentType: "ENROLLMENT" | "PENSION", period: string | null, original: number, discount: number, dueDate: string | null): Obligation {
  const balance = (original - discount).toFixed(2);
  return { paymentType, period, dueDate, originalAmount: original.toFixed(2), discountAmount: discount.toFixed(2), amountDue: balance, amountPaid: "0.00", balance, status: "PENDING" };
}
