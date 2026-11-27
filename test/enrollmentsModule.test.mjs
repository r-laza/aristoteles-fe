import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";

const page = await readFile(
  new URL("../src/pages/EnrollmentsPage.tsx", import.meta.url),
  "utf8",
);
const paymentPage = await readFile(
  new URL("../src/pages/RegisterPaymentPage.tsx", import.meta.url),
  "utf8",
);
const paymentsTable = await readFile(
  new URL("../src/features/payments/PaymentsTable.tsx", import.meta.url),
  "utf8",
);
const existingFlow = await readFile(
  new URL("../src/pages/CycleEnrollmentsPage.tsx", import.meta.url),
  "utf8",
);

test("initial load selects only the most recently started current active cycle", () => {
  assert.match(page, /function currentActiveCycle/);
  assert.match(page, /cycle\.status === "ACTIVE"/);
  assert.match(page, /cycle\.startDate <= today/);
  assert.match(page, /cycle\.endDate >= today/);
  assert.match(page, /right\.startDate\.localeCompare\(left\.startDate\)/);
  assert.match(
    page,
    /if \(!initialCycleId && !autoSelectionAttempted\.current\)/,
  );
  assert.match(
    page,
    /setSearchParams\([\s\S]*?cycleId: String\(activeCycle\.id\)/,
  );
  assert.doesNotMatch(page, /rows\[0\].*setSearchParams/);
});

test("enrollments filter by cycle, assigned branch, optional group, and student identity", () => {
  assert.match(page, /assignedBranches\(cycle\)/);
  assert.match(page, /groupsForBranch\(groups, branchId\)/);
  assert.match(page, /filterEnrollmentRows\(/);
  assert.match(page, /cycleApi\s*\.groupsForBranch\(cycleId,\s*branchId\)/);
  assert.match(page, /enrollmentsModule\.noBranchGroups/);
  assert.match(page, /const PAGE_SIZE = 20/);
});

test("group is a secondary list filter and enrollment starts from cycle plus branch", () => {
  const mainFilters = page.indexOf('className="grid gap-4 md:grid-cols-2"');
  const groupFilter = page.indexOf('htmlFor="enrollments-group"');
  const searchFilter = page.indexOf('htmlFor="enrollment-search"');
  assert.ok(
    mainFilters >= 0 && searchFilter > mainFilters && groupFilter > searchFilter,
  );
  assert.match(page, /setGroups\(\[\]\)/);
  assert.match(
    page,
    /updateFilters\(\{ branchId: event\.target\.value, groupId: "" \}\)/,
  );
  assert.doesNotMatch(page, /disabled=\{!groupId\}/);
});

test("enrollment toolbar stacks in search, group, action order with aligned desktop controls", () => {
  assert.match(
    page,
    /grid grid-cols-1 items-end gap-4[^"]*lg:grid-cols-\[minmax\(0,2fr\)_minmax\(0,1fr\)_auto\]/,
  );
  assert.match(page, /className="field h-12 pl-10 text-sm"/);
  assert.match(page, /className="field h-12 text-sm"/);
  assert.match(
    page,
    /className="primary-button h-12 w-full justify-center whitespace-nowrap lg:w-auto"/,
  );
  const search = page.indexOf('id="enrollment-search"');
  const group = page.indexOf('id="enrollments-group"');
  const action = page.indexOf('t("enrollmentsModule.enrollNew")');
  assert.ok(search >= 0 && search < group && group < action);
  const source = ts.createSourceFile(
    "EnrollmentsPage.tsx", page, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX,
  );
  let toolbar;
  function visit(node) {
    if (
      ts.isJsxElement(node) &&
      node.openingElement.attributes.properties.some(
        (attribute) =>
          ts.isJsxAttribute(attribute) &&
          attribute.name.getText(source) === "className" &&
          attribute.initializer &&
          ts.isStringLiteral(attribute.initializer) &&
          attribute.initializer.text.includes("lg:grid-cols-[minmax(0,2fr)"),
      )
    ) toolbar = node;
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(toolbar, "toolbar grid exists");
  const controls = toolbar.children.filter(ts.isJsxElement);
  assert.equal(controls.length, 3, "all three controls are direct grid children");
  assert.match(controls[0].getText(source), /id="enrollment-search"/);
  assert.doesNotMatch(controls[0].getText(source), /id="enrollments-group"/);
  assert.match(controls[1].getText(source), /id="enrollments-group"/);
  assert.equal(controls[2].openingElement.tagName.getText(source), "button");
});

test("new enrollment navigates to the existing branch-preselected flow", () => {
  assert.match(
    page,
    /`\/admin\/cycles\/\$\{cycleId\}\/enrollments\?branchId=\$\{branchId\}&returnTo=enrollments`/,
  );
  assert.doesNotMatch(page, /EnrollmentConfirmation|StudentForm|CycleModal/);
  assert.match(existingFlow, /searchParams\.get\("branchId"\)/);
  assert.match(
    existingFlow,
    /cycleApi\.groupsForBranch\(\s*id,\s*validBranchId,?\s*\)/,
  );
  assert.match(existingFlow, /cycleData\.branches\.some/);
  assert.match(existingFlow, /setSelectedGroupId\(""\)/);
  assert.match(existingFlow, /onChange=\{\(event\) => void selectBranch/);
  assert.match(existingFlow, /branchGroups\.map/);
  assert.match(existingFlow, /preuniversityInstallments/);
  assert.match(existingFlow, /preuniversityDueRule/);
  assert.match(existingFlow, /returnToEnrollments/);
  assert.match(existingFlow, /state: \{ enrollmentCreated: true \}/);
});

test("existing enrollment flow aligns branch and group responsively above pension details", () => {
  assert.match(existingFlow, /className="grid gap-4 sm:grid-cols-2"/);
  assert.match(
    existingFlow,
    /grid gap-4 sm:grid-cols-2[\s\S]*?id="enrollment-branch"[\s\S]*?id="enrollment-group"/,
  );
  assert.match(
    existingFlow,
    /id="enrollment-group"[\s\S]*?<\/div>\s*<\/div>\s*\{!selectedGroup/,
  );
  assert.doesNotMatch(existingFlow, /className="field mb-4 max-w-md"/);
});

test("enrollment payment actions use the enrollment id and return to preserved filters", () => {
  assert.match(page, /paymentPath\(enrollment\.id\)/);
  assert.match(page, /ManagePaymentsButton/);
  assert.match(paymentsTable, /export function ManagePaymentsButton/);
  assert.match(paymentsTable, /<Wallet size=\{15\}/);
  assert.match(paymentsTable, /primary-button min-h-10 w-full justify-center/);
  assert.match(page, /returnTo=enrollments&branchId=\$\{branchId\}/);
  assert.match(paymentPage, /returnToEnrollments/);
  assert.match(paymentPage, /\/admin\/enrollments\?cycleId=/);
  assert.match(paymentPage, /const returnPath =/);
});

test("enrollment list contains academic fields without financial summaries", () => {
  assert.match(page, /enrollment\.student\.fullName/);
  assert.match(page, /enrollment\.student\.dni/);
  assert.match(page, /enrollment\.group\.name/);
  assert.match(page, /enrollmentDate\(enrollment\.createdAt\)/);
  assert.doesNotMatch(
    page,
    /outstandingBalance|overdueAmount|totalPaid|PaymentStatusBadge/,
  );
});
