import { t } from "../../lib/i18n";
import type { PaymentReceipt } from "../../services/payments.api";
import { formatCycleDate } from "../cycles/cycles";
import { money, periodLabel } from "./formatting";

function underHundred(value: number): string {
  if (value <= 29) return t(`receipts.numberWords.${value}`);
  const tens = Math.floor(value / 10) * 10;
  const unit = value % 10;
  return unit
    ? `${t(`receipts.numberWords.${tens}`)} ${t("receipts.numberWords.connector")} ${t(`receipts.numberWords.${unit}`)}`
    : t(`receipts.numberWords.${tens}`);
}

function underThousand(value: number): string {
  if (value < 100) return underHundred(value);
  if (value === 100) return t("receipts.numberWords.100");
  const hundreds = Math.floor(value / 100) * 100;
  const prefix =
    hundreds === 100
      ? t("receipts.numberWords.100prefix")
      : t(`receipts.numberWords.${hundreds}`);
  const remainder = value % 100;
  return remainder ? `${prefix} ${underHundred(remainder)}` : prefix;
}

function integerInWords(value: number): string {
  if (value < 1_000) return underThousand(value);
  if (value < 1_000_000) {
    const thousands = Math.floor(value / 1_000);
    const prefix =
      thousands === 1
        ? t("receipts.numberWords.thousand")
        : `${underThousand(thousands)} ${t("receipts.numberWords.thousand")}`;
    const remainder = value % 1_000;
    return remainder ? `${prefix} ${underThousand(remainder)}` : prefix;
  }
  if (value < 1_000_000_000) {
    const millions = Math.floor(value / 1_000_000);
    const prefix =
      millions === 1
        ? t("receipts.numberWords.oneMillion")
        : `${integerInWords(millions)} ${t("receipts.numberWords.millions")}`;
    const remainder = value % 1_000_000;
    return remainder ? `${prefix} ${integerInWords(remainder)}` : prefix;
  }
  const billions = Math.floor(value / 1_000_000_000);
  const prefix =
    billions === 1
      ? t("receipts.numberWords.oneBillion")
      : `${integerInWords(billions)} ${t("receipts.numberWords.billions")}`;
  const remainder = value % 1_000_000_000;
  return remainder ? `${prefix} ${integerInWords(remainder)}` : prefix;
}

function amountInWords(value: string) {
  const normalized = value.trim().replace(",", ".");
  const [integerPart = "0", decimalPart = ""] = normalized.split(".");
  const integer = Number(integerPart);
  const cents = Number(decimalPart.padEnd(2, "0").slice(0, 2));
  const words = integerInWords(integer);
  const result = t("receipts.amountWords", {
    words,
    cents: String(cents).padStart(2, "0"),
  });
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export async function downloadReceiptPdf(receipt: PaymentReceipt) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const left = 20;
  const right = 190;
  let y = 22;

  const heading = (label: string) => {
    y += 7;
    doc.setFillColor(240, 249, 255);
    doc.rect(left, y - 5, right - left, 9, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(12, 74, 110);
    doc.text(label, left + 3, y + 1);
    y += 10;
  };
  const row = (label: string, value: string) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 65, 85);
    doc.text(`${label}:`, left, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value, 125) as string[];
    doc.text(lines, 62, y);
    y += Math.max(6, lines.length * 5);
  };
  const headerMetadata = (receiptNumber: string, formattedDate: string) => {
    const gap = 10;
    const columnWidth = (right - left - gap) / 2;
    const dateX = left + columnWidth + gap;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const receiptLines = doc.splitTextToSize(
      receiptNumber,
      columnWidth - 6,
    ) as string[];
    const dateLines = doc.splitTextToSize(
      formattedDate,
      columnWidth - 6,
    ) as string[];
    const valueHeight = Math.max(receiptLines.length, dateLines.length) * 5;
    const blockHeight = 11 + valueHeight;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(left, y, right - left, blockHeight, 2, 2, "FD");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(t("receipts.receiptNumber"), left + 4, y + 5);
    doc.text(t("receipts.date"), dateX + 4, y + 5);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(receiptLines, left + 4, y + 11);
    doc.text(dateLines, dateX + 4, y + 11);
    y += blockHeight;
  };

  doc.setTextColor(8, 47, 73);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text(t("receipts.academy"), left, y);
  doc.setFontSize(15);
  doc.text(t("receipts.title").toUpperCase(), right, y, { align: "right" });
  y += 11;
  doc.setDrawColor(14, 116, 144);
  doc.setLineWidth(0.6);
  doc.line(left, y, right, y);
  y += 8;
  headerMetadata(
    receipt.receiptNumber,
    formatCycleDate(receipt.payment.date.slice(0, 10)),
  );

  heading(t("receipts.payerInformationHeading"));
  row(t("receipts.payerName"), receipt.payer.name);
  row(
    t("receipts.document"),
    `${t(`receipts.documentTypes.${receipt.payer.documentType}`)} ${receipt.payer.documentNumber}`,
  );
  if (receipt.payer.relationship)
    row(
      t("receipts.relationshipPdf"),
      t(`receipts.relationships.${receipt.payer.relationship}`),
    );

  heading(t("receipts.studentInformation"));
  row(t("receipts.student"), receipt.student.name);
  row(t("receipts.group"), receipt.student.group);
  row(t("receipts.academicCycle"), receipt.student.cycle);

  heading(t("receipts.paymentDetails"));
  const conceptPeriod = receipt.obligation.period
    ? periodLabel(receipt.obligation.period)
    : t(`payments.types.${receipt.obligation.paymentType}`);
  const concept = t("receipts.obligationConcept", {
    name:
      receipt.obligation.name ??
      t(`payments.types.${receipt.obligation.paymentType}`),
    period: conceptPeriod,
  });
  const columns = [left, 108, 137, 165];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(t("receipts.concept"), columns[0], y);
  doc.text(t("receipts.original"), columns[1], y, { align: "right" });
  doc.text(t("receipts.discount"), columns[2], y, { align: "right" });
  doc.text(t("receipts.paid"), right, y, { align: "right" });
  y += 3;
  doc.setDrawColor(203, 213, 225);
  doc.line(left, y, right, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text(doc.splitTextToSize(concept, 78), columns[0], y);
  doc.text(money(receipt.obligation.originalAmount ?? "0"), columns[1], y, {
    align: "right",
  });
  doc.text(money(receipt.obligation.discountAmount), columns[2], y, {
    align: "right",
  });
  doc.text(money(receipt.obligation.paidAmount), right, y, { align: "right" });
  y += 13;
  doc.line(105, y, right, y);
  y += 6;
  row(t("receipts.subtotal"), money(receipt.obligation.originalAmount ?? "0"));
  row(t("receipts.discount"), money(receipt.obligation.discountAmount));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(t("receipts.totalPaid"), 105, y);
  doc.text(money(receipt.payment.amount), right, y, { align: "right" });
  y += 11;
  row(
    t("receipts.paymentMethod"),
    t(`payments.methods.${receipt.payment.method}`),
  );
  if (receipt.payment.reference)
    row(t("receipts.reference"), receipt.payment.reference);

  y += 5;
  const words = amountInWords(receipt.payment.amount);
  doc.setFontSize(10);
  const wordLines = doc.splitTextToSize(words, 162) as string[];
  const wordsBlockHeight = 14 + wordLines.length * 5;
  if (y + wordsBlockHeight > 264) {
    doc.addPage();
    y = 22;
  }
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(left, y, right - left, wordsBlockHeight, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);
  doc.text(`${t("receipts.amountInWords")}:`, left + 4, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text(wordLines, left + 4, y + 14);

  doc.setDrawColor(203, 213, 225);
  doc.line(left, 270, right, 270);
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(t("receipts.academy"), left, 278);
  doc.setFont("helvetica", "normal");
  doc.text(t("receipts.generatedBySystem"), left, 284);
  doc.save(t("receipts.fileName", { number: receipt.receiptNumber }));
}
