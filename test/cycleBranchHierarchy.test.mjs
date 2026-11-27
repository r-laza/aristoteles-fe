import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("cycle detail renders branch sections with scoped group and enrollment actions", async () => {
  const source = await readFile(
    new URL("../src/pages/AcademicCycleDetailPage.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /data\.cycle\.branches\.map/);
  assert.match(source, /group\.branch\.id === branch\.id/);
  assert.match(source, /enrollments\?branchId=\$\{branch\.id\}/);
  assert.match(source, /setActionBranchId\(branch\.id\)/);
});

test("cycle detail omits the redundant students and modules section", async () => {
  const source = await readFile(
    new URL("../src/pages/AcademicCycleDetailPage.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /cycleDetail\.studentsEnrollments/);
  assert.doesNotMatch(source, /cycle-student-search|student-group-filter/);
  assert.doesNotMatch(source, /cycleDetail\.managePayments/);
  assert.doesNotMatch(source, /enrollmentPage\.addStudents/);
  assert.doesNotMatch(source, /filteredEnrollments|visibleEnrollments/);
  assert.match(source, /branches\.hierarchyTitle/);
  assert.match(source, /cycleDetail\.studentCount/);
  assert.match(source, /enrollments\?branchId=\$\{branch\.id\}/);
});

test("cycle creation adds groups within each selected branch", async () => {
  const source = await readFile(
    new URL("../src/features/cycles/GroupAssignments.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /branchIds\.map/);
  assert.match(source, /row\.branchId === branchId/);
  assert.match(source, /setAddingBranch\(branchId\)/);
  assert.match(source, /const branchAvailable = groups\.filter/);
  assert.match(source, /row\.groupId === group\.id/);
  assert.match(source, /pensionId: null/);
});

test("adding a branch immediately keeps it in the form preview", async () => {
  const source = await readFile(
    new URL("../src/features/cycles/CycleForm.tsx", import.meta.url),
    "utf8",
  );
  assert.match(
    source,
    /setBranchIds\(\(current\) => \[\.\.\.current, Number\(branchToAdd\)\]\)/,
  );
  assert.match(source, /branchIds=\{branchIds\}/);
  assert.match(source, /branches=\{branches\}/);
  assert.match(source, /setBranchIds\(\(current\) =>\s*current\.filter/);
  assert.match(source, /setGroups\(\(current\) =>\s*current\.filter/);
});

test("cycle create and edit use dedicated admin pages", async () => {
  const [routes, list, detail] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../src/pages/AcademicCyclesPage.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../src/pages/AcademicCycleDetailPage.tsx", import.meta.url),
      "utf8",
    ),
  ]);
  assert.match(routes, /path="\/admin\/cycles\/new"/);
  assert.match(routes, /path="\/admin\/cycles\/:id\/edit"/);
  assert.match(list, /to="\/admin\/cycles\/new"/);
  assert.match(detail, /to=\{`\/admin\/cycles\/\$\{id\}\/edit`\}/);
  assert.doesNotMatch(list, /<CycleForm/);
});

test("branch enrollment links preselect only a branch assigned to the cycle", async () => {
  const source = await readFile(
    new URL("../src/pages/CycleEnrollmentsPage.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /searchParams\.get\("branchId"\)/);
  assert.match(source, /cycleData\.branches\.some/);
});

test("cycle detail configures a branch and multiple groups in one operation", async () => {
  const source = await readFile(
    new URL("../src/pages/AcademicCycleDetailPage.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /function ConfigureBranchesForm/);
  assert.match(source, /type="checkbox"/);
  assert.match(source, /Object\.entries\(selection\)/);
  assert.match(source, /cycleApi\.configureCycleBranch/);
  assert.match(source, /cycleApi\.deleteCycleBranch/);
  assert.doesNotMatch(source, /function AddCycleGroupForm/);
  assert.doesNotMatch(source, /function AddCycleBranchForm/);
});
