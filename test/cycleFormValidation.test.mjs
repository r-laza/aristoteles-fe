import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const form = await readFile(
  new URL("../src/features/cycles/CycleForm.tsx", import.meta.url),
  "utf8",
);
const assignments = await readFile(
  new URL("../src/features/cycles/GroupAssignments.tsx", import.meta.url),
  "utf8",
);
const translations = await readFile(
  new URL("../src/locales/es.json", import.meta.url),
  "utf8",
);

test("cycle form reports every required field without native validation popups", () => {
  assert.match(form, /<form onSubmit=\{submit\} noValidate/);
  for (const key of [
    "name",
    "category",
    "startDate",
    "endDate",
    "fee",
    "branches",
    "groups",
  ])
    assert.match(form, new RegExp(`nextErrors\\.${key}`));
  assert.match(form, /endDate <= startDate/);
  assert.match(form, /groups\.forEach/);
  assert.match(form, /nextErrors\[`pension-/);
});

test("invalid cycle fields expose accessible inline errors and focus the first error", () => {
  assert.match(form, /aria-invalid=\{Boolean\(validationErrors\.name\)\}/);
  assert.match(form, /aria-describedby=\{\s*validationErrors\.name/);
  assert.match(form, /data-validation-key="name"/);
  assert.match(form, /!border-red-500/);
  assert.match(form, /focusFirstInvalid\(form, nextErrors\)/);
  assert.match(form, /requestAnimationFrame/);
  assert.match(form, /cycles\.validation\.summary/);
  assert.match(assignments, /data-validation-key=\{`pension-/);
  assert.match(
    assignments,
    /aria-invalid=\{Boolean\([\s\S]*?validationErrors\[[\s\S]*?`pension-/,
  );
});

test("cycle validation messages are registered in Spanish translations", () => {
  for (const key of [
    "summary",
    "summaryHelp",
    "nameRequired",
    "categoryRequired",
    "startDateRequired",
    "endDateRequired",
    "endAfterStart",
    "moduleRequired",
    "branchRequired",
    "groupRequired",
    "pensionRequired",
  ])
    assert.match(translations, new RegExp(`"${key}"`));
});
