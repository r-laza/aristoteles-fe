import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../src/pages/CycleEnrollmentsPage.tsx", import.meta.url), "utf8");

test("Preuniversitario selects a student-specific one to three installment plan", () => {
  assert.match(page, /cycle\.category === "PREUNIVERSITY"/);
  assert.match(page, /\[1, 2, 3\]\.map/);
  assert.match(page, /preuniversityInstallments/);
});

test("student plan supports the fifteenth and last calendar day", () => {
  assert.match(page, /value="FIFTEENTH"/);
  assert.match(page, /value="LAST_DAY"/);
  assert.match(page, /preuniversityDueRule/);
});
