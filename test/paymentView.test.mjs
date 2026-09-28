import { test } from "node:test";
import assert from "node:assert/strict";
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
  student: { fullName: "María Pérez" },
  group: { id: 2 },
  obligations: [enrollment, january, february],
};

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
  assert.equal(summary.status, "PENDING");
  assert.equal(accountStatus([], "2026-09-20"), null);
});

test("paid current installments and unpaid future installments can be up to date", async () => {
  const { accountStatus, pensionSummary } =
    await import("../src/features/payments/paymentView.ts");
  const charges = [
    { ...january, dueDate: "2026-01-10", amountPaid: "80.50", balance: "0" },
    { ...february, dueDate: "2026-02-10" },
  ];
  assert.equal(accountStatus(charges, "2026-01-20"), "PAID");
  assert.equal(accountStatus(charges, "2026-02-11"), "PENDING");
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
    "PARTIAL",
  );
});
