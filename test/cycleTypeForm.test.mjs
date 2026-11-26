import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const form = readFileSync(new URL("../src/features/cycles/CycleForm.tsx", import.meta.url), "utf8");
const groups = readFileSync(new URL("../src/features/cycles/GroupAssignments.tsx", import.meta.url), "utf8");

test("cycle form defaults to Escolar and exposes exactly the supported categories", () => {
  assert.match(form, /cycle\?\.category \?\? "SCHOOL"/);
  assert.equal((form.match(/<option value="SCHOOL">/g) ?? []).length, 1);
  assert.equal((form.match(/<option value="PREUNIVERSITY">/g) ?? []).length, 1);
});

test("preuniversity hides only the general module and keeps pension per group", () => {
  assert.match(form, /category === "SCHOOL" \? <div>/);
  assert.match(form, /requirePension\s*\/>/);
  assert.match(groups, /\{requirePension && <div/);
  assert.doesNotMatch(form, /cycle-preuniversity-fee/);
});

test("installment configuration is not part of cycle creation", () => {
  assert.doesNotMatch(form, /preuniversity-installments/);
  assert.doesNotMatch(form, /preuniversity-due-rule/);
});
