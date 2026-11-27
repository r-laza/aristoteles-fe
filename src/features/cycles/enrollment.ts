import { ApiError } from "../../services/api";

export function enrollmentErrorKey(error: unknown) {
  if (!(error instanceof ApiError)) return "cycleDetail.saveError";
  const byCode: Record<string, string> = {
    STUDENT_ACTIVE_CYCLE_ENROLLMENT: "enrollmentPage.activeCycleConflict",
    CYCLE_NOT_ACTIVE: "enrollmentPage.inactiveCycle",
    ENROLLMENT_ALREADY_EXISTS: "cycleDetail.duplicate",
    ENROLLMENT_STUDENT_REQUIRED: "enrollmentPage.studentUnavailable",
    ENROLLMENT_GROUP_INVALID: "enrollmentPage.invalidGroup",
    ENROLLMENT_BRANCH_INVALID: "enrollmentPage.invalidBranch",
    ENROLLMENT_FEE_UNAVAILABLE: "enrollmentPage.feeUnavailable",
    ENROLLMENT_PENSION_REQUIRED: "enrollmentPage.pensionRequired",
    ENROLLMENT_PENSION_DISCOUNT_INVALID:
      "enrollmentPage.invalidPensionDiscount",
  };
  return (error.code && byCode[error.code]) ||
    (error.status === 409 ? "cycleDetail.duplicate" : "cycleDetail.saveError");
}

export function calculateDiscount(base: number, rawPercentage: string) {
  const baseCents = Math.round(base * 100);
  const percentage = Number(rawPercentage || "0");
  const discountCents = Math.round((baseCents * percentage) / 100);
  return {
    percentage,
    discountCents,
    finalCents: baseCents - discountCents,
    valid: Number.isFinite(percentage) && percentage >= 0 && percentage <= 100,
  };
}

export function calculateFixedDiscount(base: number, rawAmount: string) {
  const baseCents = Math.round(base * 100);
  const amount = Number(rawAmount || "0");
  const discountCents = Math.round(amount * 100);
  return {
    amount,
    discountCents,
    finalCents: baseCents - discountCents,
    valid:
      Number.isFinite(amount) &&
      amount >= 0 &&
      discountCents <= baseCents,
  };
}
