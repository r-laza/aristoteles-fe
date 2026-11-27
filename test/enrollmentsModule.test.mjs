import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const page = await readFile(
  new URL("../src/pages/EnrollmentsPage.tsx", import.meta.url),
  "utf8",
);
const existingFlow = await readFile(
  new URL("../src/pages/CycleEnrollmentsPage.tsx", import.meta.url),
  "utf8",
);
const paymentsTable = await readFile(
  new URL("../src/features/payments/PaymentsTable.tsx", import.meta.url),
  "utf8",
);

test("initial load preserves an active selection or selects the newest active cycle", () => {
  assert.match(page, /function currentActiveCycle/);
  assert.match(page, /cycle\.status === "ACTIVE"/);
  assert.match(page, /right\.startDate\.localeCompare\(left\.startDate\)/);
  assert.match(page, /requestedCycle\?\.status !== "ACTIVE"/);
  assert.match(page, /cycleId: String\(activeCycle\.id\)/);
  assert.doesNotMatch(page, /rows\[0\].*setSearchParams/);
});

test("cycle, branch, and group are dependent primary filters", () => {
  const cycle = page.indexOf('htmlFor="enrollments-cycle"');
  const branch = page.indexOf('htmlFor="enrollments-branch"');
  const group = page.indexOf('htmlFor="enrollments-group"');
  assert.ok(cycle >= 0 && branch > cycle && group > branch);
  assert.match(page, /className="grid gap-4 lg:grid-cols-3"/);
  assert.match(page, /updateFilters\(\{ branchId: event\.target\.value, groupId: "" \}\)/);
  assert.match(page, /cycleApi\s*\.groupsForBranch\(cycleId, branchId\)/);
});

test("the unified page provides both enrollment workflow tabs", () => {
  assert.match(page, /type EnrollmentTab = "enroll" \| "enrolled"/);
  assert.match(page, /role="tablist"/);
  assert.match(page, /enrollmentsModule\.enrollTab/);
  assert.match(page, /enrollmentPage\.enrolledStudents/);
  assert.match(page, /EnrollmentConfirmation/);
  assert.match(page, /<StudentForm/);
  assert.match(page, /cycleApi\.available\(cycleId\)/);
  assert.match(page, /setTab\("enrolled"\)/);
  assert.doesNotMatch(page, /\/admin\/cycles\/\$\{cycleId\}\/enrollments/);
});

test("confirmation preserves fixed discounts and preuniversity rules", () => {
  assert.match(existingFlow, /pensionDiscountAmount/);
  assert.match(existingFlow, /preuniversityInstallments/);
  assert.match(existingFlow, /preuniversityDueRule/);
  assert.match(existingFlow, /export function EnrollmentConfirmation/);
});

test("enrolled-student tab stays academic and payment management remains separate", () => {
  assert.match(page, /row\.student\.fullName/);
  assert.match(page, /row\.student\.dni/);
  assert.match(page, /row\.group\.name/);
  assert.match(page, /enrollmentDate\(row\.createdAt\)/);
  assert.doesNotMatch(page, /ManagePaymentsButton|paymentPath|outstandingBalance|PaymentStatusBadge/);
  assert.match(paymentsTable, /export function ManagePaymentsButton/);
});

test("enrolled students retain search and twenty-row pagination", () => {
  assert.match(page, /const PAGE_SIZE = 20/);
  assert.match(page, /filterEnrollmentRows\(/);
  assert.match(page, /enrollmentSearch/);
  assert.match(page, /visibleEnrollments/);
});
