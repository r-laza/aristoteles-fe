import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";

const source = await readFile(
  new URL("../src/features/enrollments/enrollmentFilters.ts", import.meta.url),
  "utf8",
);
const javascript = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const filters = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

const principal = { id: 1, name: "Sede Principal" };
const huanuco = { id: 3, name: "Huánuco" };
const cycle = { branches: [{ branch: principal }, { branch: huanuco }] };
const groups = [
  { id: 11, reusableGroupId: 7, branch: principal },
  { id: 12, reusableGroupId: 7, branch: huanuco },
  { id: 13, reusableGroupId: 8, branch: huanuco },
];
const enrollments = [
  {
    id: 21,
    branch: principal,
    group: { id: 11 },
    student: { fullName: "Ana Lima", dni: "111" },
  },
  {
    id: 22,
    branch: huanuco,
    group: { id: 12 },
    student: { fullName: "José Rojas", dni: "222" },
  },
  {
    id: 23,
    branch: huanuco,
    group: { id: 13 },
    student: { fullName: "Lucía Díaz", dni: "333" },
  },
];

test("every assigned cycle branch is preserved, including Huánuco", () => {
  assert.deepEqual(filters.assignedBranches(cycle), [principal, huanuco]);
});

test("reused catalog groups remain independent through branch assignment ids", () => {
  assert.deepEqual(
    filters.groupsForBranch(groups, "3").map((group) => group.id),
    [12, 13],
  );
  assert.deepEqual(
    filters.filterEnrollmentRows(enrollments, "3", "", "").map((row) => row.id),
    [22, 23],
  );
  assert.deepEqual(
    filters
      .filterEnrollmentRows(enrollments, "3", "12", "")
      .map((row) => row.id),
    [22],
  );
});

test("student search composes with cycle branch and optional group filters", () => {
  assert.deepEqual(
    filters
      .filterEnrollmentRows(enrollments, "3", "", "jose")
      .map((row) => row.id),
    [22],
  );
  assert.deepEqual(
    filters.filterEnrollmentRows(enrollments, "1", "", "222"),
    [],
  );
});
