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
    id: number;
    fullName: string;
    dni: string;
    representativeName: string;
    representativeDocumentType: ReceiptDocumentType | null;
    representativeDocumentNumber: string | null;
    relationship: "FATHER" | "MOTHER" | "OTHER";
    relationshipOther: string | null;
    primaryPhone: string | null;
  };
  group: { id: number; name: string };
  baseAmount: string;
  discountAmount: string;
  amountDue: string;
  amountPaid: string;
  balance: string;
  overdueBalance: string;
  status: PaymentStatus;
};
export type Balances = {
  rows: PaymentRow[];
  totals: { amountDue: string; amountPaid: string; balance: string };
};
export const methods = [
  "CASH",
  "TRANSFER",
  "YAPE",
  "PLIN",
] as const;
export type NewPaymentMethod = (typeof methods)[number];
export type PaymentMethod = NewPaymentMethod | "CARD" | "OTHER";
export type PaymentInput = {
  paymentType?: PaymentType;
  period?: string | null;
  periods?: string[];
  obligations?: { paymentType: PaymentType; period: string | null }[];
  amount: string;
  paymentDate: string;
  paymentMethod: NewPaymentMethod;
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
  | "paymentMethod"
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
  paymentMethod: PaymentMethod;
  paymentEvidenceKey: string | null;
  paymentEvidenceOriginalName: string | null;
  paymentEvidenceMimeType: string | null;
  paymentEvidenceStorage: "local" | "s3" | null;
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
    phone: string | null;
  };
  student: { name: string; group: string; cycle: string };
  payment: {
    date: string;
    method: PaymentMethod;
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
