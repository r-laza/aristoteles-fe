import type { Payment } from "../../services/payments.api";

export const PAYMENT_HIGHLIGHT_MS = 5000;

export function newestPaymentsFirst(payments: Payment[]): Payment[] {
  return [...payments].sort(
    (left, right) =>
      Date.parse(right.createdAt) - Date.parse(left.createdAt) ||
      right.id - left.id,
  );
}

export async function uploadPaymentEvidence(
  ids: number[],
  file: File,
  upload: (id: number, file: File) => Promise<Payment>,
): Promise<number[]> {
  const failedIds: number[] = [];
  for (const id of ids) {
    try {
      await upload(id, file);
    } catch {
      failedIds.push(id);
    }
  }
  return failedIds;
}
