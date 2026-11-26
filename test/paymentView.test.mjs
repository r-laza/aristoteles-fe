import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  emptyFilters,
  filterPaymentRows,
  obligationStatus,
  pendingFor,
  scopedCharges,
  sumAmounts,
} from "../src/features/payments/paymentView.ts";

const enrollment = {
  paymentType: "ENROLLMENT",
  period: null,
  amountDue: "100",
  amountPaid: "100",
  balance: "0",
  status: "PAID",
};
const january = {
  paymentType: "PENSION",
  period: "2026-01",
  amountDue: "80.50",
  amountPaid: "30.25",
  balance: "50.25",
  status: "OVERDUE",
};
const february = {
  paymentType: "PENSION",
  period: "2026-02",
  amountDue: "80.50",
  amountPaid: "0",
  balance: "80.50",
  status: "PENDING",
};
const row = {
  id: 1,
  status: "OVERDUE",
  student: { fullName: "María Pérez" },
  group: { id: 2 },
  obligations: [enrollment, january, february],
};

test("money uses the Peruvian sol symbol", async () => {
  const locale = JSON.parse(
    await readFile(new URL("../src/locales/es.json", import.meta.url), "utf8"),
  );
  assert.equal(locale.cycles.amount, "S/{{amount}}");
});

test("visible terminology uses módulo instead of the legacy term", async () => {
  const localeText = await readFile(
    new URL("../src/locales/es.json", import.meta.url),
    "utf8",
  );
  const locale = JSON.parse(localeText);
  assert.doesNotMatch(localeText, new RegExp("matr[i\\u00ed]cul", "i"));
  assert.equal(locale.navigation.enrollmentsPensions, "Módulos y pensiones");
  assert.equal(locale.payments.enrollmentPending, "Pendiente de módulo");
  assert.equal(locale.payments.types.ENROLLMENT, "Módulo");
});

test("settled enrollment does not hide outstanding pensions", () => {
  assert.equal(obligationStatus(row.obligations), "OVERDUE");
  assert.equal(
    filterPaymentRows([row], { ...emptyFilters, status: "PAID" }).length,
    0,
  );
  assert.equal(
    filterPaymentRows([row], {
      ...emptyFilters,
      type: "ENROLLMENT",
      status: "PAID",
    }).length,
    0,
  );
  assert.equal(pendingFor([row], "ENROLLMENT"), "0.00");
  assert.equal(pendingFor([row], "PENSION"), "130.75");
});

test("filtered totals use only the selected obligation and period", () => {
  const charges = scopedCharges(row, {
    ...emptyFilters,
    type: "PENSION",
    month: "2026-01",
  });
  assert.equal(sumAmounts(charges, "amountPaid"), "30.25");
  assert.equal(sumAmounts(charges, "balance"), "50.25");
  assert.equal(
    sumAmounts(
      scopedCharges(row, { ...emptyFilters, month: "2026-01" }),
      "amountPaid",
    ),
    "130.25",
  );
  assert.equal(sumAmounts(row.obligations, "balance"), "130.75");
});

test("cents remain exact when summed across students", () => {
  assert.equal(
    sumAmounts(
      [{ balance: "0.10" }, { balance: "0.20" }, { balance: "99.99" }],
      "balance",
    ),
    "100.29",
  );
});

test("search ignores accents and composes with group filters", () => {
  assert.equal(
    filterPaymentRows([row], { ...emptyFilters, search: " maria ", group: "2" })
      .length,
    1,
  );
  assert.equal(
    filterPaymentRows([row], { ...emptyFilters, search: "maria", group: "3" })
      .length,
    0,
  );
});

test("a period without obligations is not reported as paid", () => {
  assert.equal(obligationStatus([]), null);
  assert.equal(
    filterPaymentRows([row], {
      ...emptyFilters,
      type: "PENSION",
      month: "2027-01",
      status: "PAID",
    }).length,
    0,
  );
});

test("future cycles still expose the full pension schedule", async () => {
  const { pensionSummary, accountStatus } =
    await import("../src/features/payments/paymentView.ts");
  const future = {
    ...row,
    obligations: [
      enrollment,
      { ...february, period: "2027-01", dueDate: "2027-01-10" },
      { ...february, period: "2027-02", dueDate: "2027-02-10" },
    ],
  };
  const summary = pensionSummary(future, "2026-09-20");
  assert.equal(summary.installments.length, 2);
  assert.equal(summary.paid, 0);
  assert.equal(summary.next.period, "2027-01");
  assert.equal(summary.status, "PAID");
  assert.equal(accountStatus([], "2026-09-20"), null);
});

test("future unpaid installments are pending and overdue debt has priority", async () => {
  const { accountStatus, pensionSummary } =
    await import("../src/features/payments/paymentView.ts");
  const charges = [
    { ...january, dueDate: "2026-01-10", amountPaid: "80.50", balance: "0" },
    { ...february, dueDate: "2026-02-10" },
  ];
  assert.equal(accountStatus(charges, "2026-01-20"), "PAID");
  assert.equal(accountStatus(charges, "2026-02-11"), "OVERDUE");
  assert.equal(
    pensionSummary({ ...row, obligations: charges }, "2026-01-20").paid,
    1,
  );
  assert.equal(
    accountStatus(
      [
        {
          ...february,
          amountPaid: "20",
          balance: "60.50",
          dueDate: "2026-02-10",
        },
      ],
      "2026-02-01",
    ),
    "PAID",
  );
  assert.equal(
    accountStatus([
      { ...january, dueDate: "2026-01-10" },
      { ...february, dueDate: "2026-03-10" },
    ], "2026-02-01"),
    "OVERDUE",
  );
});

test("warning period includes its boundary and excludes later installments", async () => {
  const { accountStatus } = await import("../src/features/payments/paymentView.ts");
  assert.equal(accountStatus([{ ...february, dueDate: "2027-01-17" }], "2027-01-10", 7), "PENDING");
  assert.equal(accountStatus([{ ...february, dueDate: "2027-01-18" }], "2027-01-10", 7), "PAID");
  assert.equal(accountStatus([{ ...february, dueDate: "2027-01-10" }], "2027-01-10", 7), "PENDING");
  assert.equal(accountStatus([{ ...february, dueDate: "2027-01-09" }], "2027-01-10", 7), "OVERDUE");
  assert.equal(accountStatus([{ ...february, dueDate: "2027-01-09", amountPaid: "80.50", balance: "0" }], "2027-01-10", 7), "PAID");
});
