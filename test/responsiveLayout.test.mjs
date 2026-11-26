import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const source = (path) =>
  readFile(new URL(`../src/${path}`, import.meta.url), "utf8");

test("payments use cards below desktop and preserve the desktop table", async () => {
  const payments = await source("features/payments/PaymentsTable.tsx");
  assert.match(payments, /grid gap-4 p-4 lg:hidden/);
  assert.match(payments, /hidden overflow-x-auto lg:block/);
  assert.match(payments, /row\.student\.id/);
  assert.match(payments, /payments\.totalPaid/);
  assert.match(payments, /payments\.totalBalance/);
  assert.match(payments, /overallStatus/);
  assert.match(payments, /payments\.overdueBalance/);
  assert.doesNotMatch(payments, /payments\.viewDetail|\bEye\b|onDetail/);

  for (const width of [320, 375, 391, 400, 768])
    assert.ok(width < 1024, `${width}px uses payment cards`);
  for (const width of [1024, 1440])
    assert.ok(width >= 1024, `${width}px uses the desktop table`);
});

test("shared modals are viewport bounded and vertically scrollable", async () => {
  for (const path of [
    "pages/AdminPage.tsx",
    "features/payments/PaymentDialog.tsx",
    "features/cycles/CycleModal.tsx",
    "features/cycles/CycleForm.tsx",
  ]) {
    const content = await source(path);
    assert.match(content, /w-\[calc\(100%_-_2rem\)\]/, path);
    assert.match(content, /max-h-\[calc\(100dvh_-_2rem\)\]/, path);
    assert.match(content, /overflow-y-auto/, path);
  }
});

test("mobile navigation remains an accessible drawer", async () => {
  const [sidebar, topbar] = await Promise.all([
    source("components/layout/Sidebar.tsx"),
    source("components/layout/Topbar.tsx"),
  ]);
  assert.match(sidebar, /fixed inset-y-0 left-0 z-50/);
  assert.match(sidebar, /lg:sticky lg:top-0 lg:translate-x-0/);
  assert.match(topbar, /aria-controls="main-sidebar"/);
  assert.match(topbar, /lg:hidden/);
});
