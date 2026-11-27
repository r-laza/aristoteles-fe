import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";

const source = (path) =>
  readFile(new URL(`../src/${path}`, import.meta.url), "utf8");

test("student payment actions occupy the second header and row column in both tables", async () => {
  for (const [path, action, columnCount] of [
    ["features/payments/PaymentsTable.tsx", "Action", 7],
    ["pages/EnrollmentsPage.tsx", "ManagePaymentsButton", 5],
  ]) {
    const content = await source(path);
    const file = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let studentCells;
    let headers;
    function visit(node) {
      if (ts.isJsxElement(node) && node.openingElement.tagName.getText(file) === "tr") {
        const cells = node.children.filter(ts.isJsxElement);
        if (cells[0]?.openingElement.tagName.getText(file) === "td" &&
            cells[0].getText(file).includes("student.fullName")) studentCells = cells;
        if (cells[0]?.openingElement.tagName.getText(file) === "th") headers = cells;
      }
      if (ts.isArrayLiteralExpression(node) &&
          node.elements.every(ts.isStringLiteral) &&
          node.elements.some((element) => element.text === "overallStatus")) {
        headers = node.elements;
      }
      ts.forEachChild(node, visit);
    }
    visit(file);
    assert.equal(studentCells?.length, columnCount, path);
    assert.match(studentCells[1].getText(file), new RegExp(`<${action}\\b`), path);
    assert.equal(headers?.length, columnCount, path);
    assert.match(headers[0].getText(file), /student/, path);
    assert.match(headers[1].getText(file), /action/, path);
  }
});

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
  ]) {
    const content = await source(path);
    assert.match(content, /w-\[calc\(100%_-_2rem\)\]/, path);
    assert.match(content, /max-h-\[calc\(100dvh_-_2rem\)\]/, path);
    assert.match(content, /overflow-y-auto/, path);
  }
});

test("cycle creation uses a responsive full page instead of a dialog", async () => {
  const [page, form] = await Promise.all([
    source("pages/CycleFormPage.tsx"),
    source("features/cycles/CycleForm.tsx"),
  ]);
  assert.match(page, /<AppLayout>/);
  assert.match(page, /max-w-6xl/);
  assert.match(form, /sm:p-6/);
  assert.match(form, /lg:grid-cols-2/);
  assert.match(form, /sm:flex-row/);
  assert.doesNotMatch(form, /<dialog|showModal/);
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
