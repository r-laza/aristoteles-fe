import { api, apiForm } from "./api";
export type PaymentType = "ENROLLMENT" | "PENSION";
export type PaymentStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
export type Obligation = {
  paymentType: PaymentType;
  period: string | null;
  dueDate: string | null;
  amountDue: string;
  originalAmount: string;
  discountAmount: string;
  amountPaid: string;
  balance: string;
  status: PaymentStatus;
};
export type PaymentRow = {
  enrollmentFeeName: string;
  pensionName: string | null;
  pensionMonthlyAmount: string | null;
  cycle: string;
  obligations: Obligation[];
  lastPaymentDate: string | null;
  id: number;
  student: {
    fullName: string;
    dni: string;
    representativeName: string;
    representativeDocumentType: ReceiptDocumentType | null;
    representativeDocumentNumber: string | null;
    relationship: "FATHER" | "MOTHER" | "OTHER";
    relationshipOther: string | null;
  };
  group: { id: number; name: string };
  baseAmount: string;
  discountAmount: string;
  amountDue: string;
  amountPaid: string;
  balance: string;
  status: PaymentStatus;
};
export type Balances = {
  rows: PaymentRow[];
  totals: { amountDue: string; amountPaid: string; balance: string };
};
export const methods = [
  "CASH",
  "TRANSFER",
  "CARD",
  "YAPE",
  "PLIN",
  "OTHER",
] as const;
export type PaymentInput = {
  paymentType: PaymentType;
  period: string | null;
  periods?: string[];
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  reference: string;
  notes: string;
  payerName: string;
  payerDocumentType: ReceiptDocumentType;
  payerDocumentNumber: string;
  payerRelationship: ReceiptRelationship | "";
  payerRelationshipOther: string;
};
export type PaymentRegistration = {
  payments: Payment[];
  totalAmount: string;
  obligationCount: number;
  evidenceUploadFailed?: boolean;
};
export type Payment = Omit<
  PaymentInput,
  | "reference"
  | "notes"
  | "payerName"
  | "payerDocumentType"
  | "payerDocumentNumber"
  | "payerRelationship"
  | "payerRelationshipOther"
> & {
  reference: string | null;
  notes: string | null;
  id: number;
  createdAt: string;
  receiptNumber: string | null;
  payerName: string | null;
  payerDocumentType: ReceiptDocumentType | null;
  payerDocumentNumber: string | null;
  payerRelationship: ReceiptRelationship | null;
  payerRelationshipOther: string | null;
  paymentEvidenceKey: string | null;
  paymentEvidenceOriginalName: string | null;
  paymentEvidenceMimeType: string | null;
};
export type ReceiptDocumentType = "DNI" | "CE" | "PASSPORT";
export type ReceiptRelationship = "FATHER" | "MOTHER" | "GUARDIAN" | "OTHER";
export type ReceiptInput = {
  payerName: string;
  payerDocumentType: ReceiptDocumentType;
  payerDocumentNumber: string;
  payerRelationship: ReceiptRelationship | "";
  payerRelationshipOther: string;
};
export type PaymentReceipt = {
  paymentId: number;
  receiptNumber: string;
  generatedAt: string;
  payer: {
    name: string;
    documentType: ReceiptDocumentType;
    documentNumber: string;
    relationship: ReceiptRelationship | null;
    relationshipOther: string | null;
  };
  student: { name: string; group: string; cycle: string };
  payment: {
    date: string;
    method: (typeof methods)[number];
    reference: string | null;
    amount: string;
  };
  obligation: {
    paymentType: PaymentType;
    period: string | null;
    name: string | null;
    originalAmount: string | null;
    discountAmount: string;
    paidAmount: string;
  };
};
export const paymentsApi = {
  balances: (id: number) => api<Balances>(`/api/admin/payments/cycles/${id}`),
  register: (id: number, input: PaymentInput) =>
    api<PaymentRegistration>(`/api/admin/payments/enrollments/${id}`, input),
  history: (id: number) =>
    api<Payment[]>(`/api/admin/payments/enrollments/${id}`),
  receipt: (id: number) =>
    api<PaymentReceipt>(`/api/admin/payments/${id}/receipt`),
  createReceipt: (id: number, input: ReceiptInput) =>
    api<PaymentReceipt>(`/api/admin/payments/${id}/receipt`, input),
  uploadEvidence: (id: number, file: File) => {
    const body = new FormData();
    body.append("evidence", file);
    return apiForm<Payment>(`/api/admin/payments/${id}/evidence`, body);
  },
  evidenceUrl: (id: number, download = false) =>
    `/api/admin/payments/${id}/evidence${download ? "?download=1" : ""}`,
};
