import type { ReceiptDocumentType } from "../../services/payments.api";

export type PayerFieldErrors = Partial<
  Record<"payerName" | "payerDocumentNumber", "required" | "documentFormat">
>;

const UNREGISTERED_VALUE = "sin registrar";

export function payerFieldValue(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.toLocaleLowerCase("es") === UNREGISTERED_VALUE
    ? ""
    : normalized;
}

export function validatePayerInformation(values: {
  payerName: string;
  documentType: ReceiptDocumentType;
  payerDocumentNumber: string;
}): PayerFieldErrors {
  const errors: PayerFieldErrors = {};
  const payerName = payerFieldValue(values.payerName);
  const documentNumber = payerFieldValue(values.payerDocumentNumber);

  if (!payerName) errors.payerName = "required";
  if (!documentNumber) {
    errors.payerDocumentNumber = "required";
  } else if (
    values.documentType === "DNI"
      ? !/^\d{8}$/.test(documentNumber)
      : !/^[A-Za-z0-9]{6,12}$/.test(documentNumber)
  ) {
    errors.payerDocumentNumber = "documentFormat";
  }

  return errors;
}
