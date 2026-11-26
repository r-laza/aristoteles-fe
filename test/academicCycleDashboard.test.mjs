import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("academic cycles use persisted lifecycle states and confirmation actions", async () => {
  const cycleSource = await readFile(new URL("../src/features/cycles/cycles.ts", import.meta.url), "utf8");
  const pageSource = await readFile(new URL("../src/pages/AcademicCyclesPage.tsx", import.meta.url), "utf8");
  assert.match(cycleSource, /"UPCOMING" \| "ACTIVE" \| "CLOSED"/);
  assert.match(cycleSource, /\/activate/);
  assert.match(cycleSource, /\/close/);
  assert.match(pageSource, /CycleModal/);
  assert.match(pageSource, /cycle-branch/);
  assert.match(pageSource, /LockKeyhole/);
  assert.match(pageSource, /bg-red-600[\s\S]*hover:bg-red-700/);
});

test("financial dashboard exposes hierarchical filters and read-only debtor detail", async () => {
  const pageSource = await readFile(new URL("../src/pages/AdminDashboardPage.tsx", import.meta.url), "utf8");
  const listSource = await readFile(new URL("../src/features/dashboard/DashboardFinancialLists.tsx", import.meta.url), "utf8");
  assert.match(pageSource, /cycle\.status\.toLowerCase\(\)/);
  assert.match(pageSource, /DashboardFinancialLists/);
  assert.match(listSource, /fetchDashboardPayments/);
  assert.match(listSource, /fetchDashboardDebtors/);
  assert.match(listSource, /fetchDashboardPending/);
  assert.match(listSource, /const tabs: View\[\] = \["debtors", "pending", "upToDateTab"\]/);
  assert.match(listSource, /useState<View>\("debtors"\)/);
  assert.match(listSource, /downloadDashboardDebtors/);
  assert.match(listSource, /FileSpreadsheet/);
  assert.match(listSource, /bg-emerald-600[\s\S]*hover:bg-emerald-700/);
  assert.match(listSource, /key=\{item\.studentId\}/);
  assert.doesNotMatch(listSource, /paymentsApi\.register|editStudent|saveStudent/);
  assert.match(listSource, /fetchDashboardDebtor/);
  assert.match(listSource, /CompactFinancialDetail/);
  assert.match(listSource, /CycleModal/);
  assert.doesNotMatch(listSource, /navigate\(/);
});

test("dashboard finance lists use desktop tables and mobile cards", async () => {
  const source = await readFile(
    new URL("../src/features/dashboard/DashboardFinancialLists.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /function StudentFinanceList/);
  assert.match(source, /md:hidden/);
  assert.match(source, /hidden overflow-hidden rounded-xl border border-slate-200 md:block/);
  assert.match(source, /adminDashboard\.outstandingBalance/);
  assert.match(source, /hover:bg-sky-50\/50/);
});
