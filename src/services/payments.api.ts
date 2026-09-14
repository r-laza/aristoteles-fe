import { api } from "./api";
export type PaymentRow = {
  id: number;
  student: { fullName: string; username: string };
  group: { name: string };
  baseAmount: string;
  discountAmount: string;
  amountDue: string;
  amountPaid: string;
  balance: string;
  status: "PENDING" | "PARTIAL" | "PAID";
};
export type Balances = {
  rows: PaymentRow[];
  totals: { amountDue: string; amountPaid: string; balance: string };
};
export const methods = ["CASH", "TRANSFER", "CARD", "OTHER"] as const;
export type PaymentInput = {
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  reference: string;
  notes: string;
};
export type Payment = Omit<PaymentInput, "reference" | "notes"> & {
  reference: string | null;
  notes: string | null;
  id: number;
  createdAt: string;
};
export const paymentsApi = {
  balances: (id: number) => api<Balances>(`/api/admin/payments/cycles/${id}`),
  register: (id: number, input: PaymentInput) =>
    api<Payment>(`/api/admin/payments/enrollments/${id}`, input),
  history: (id: number) =>
    api<Payment[]>(`/api/admin/payments/enrollments/${id}`),
};
