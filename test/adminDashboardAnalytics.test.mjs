import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const locale = JSON.parse(
  await readFile(new URL("../src/locales/es.json", import.meta.url), "utf8"),
);
const chartSource = await readFile(
  new URL(
    "../src/components/dashboard/AdminDashboardCharts.tsx",
    import.meta.url,
  ),
  "utf8",
);
const exports = {};
const compiled = ts.transpileModule(chartSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
new Function("require", "exports", compiled)((name) => {
  if (name === "react/jsx-runtime") return require(name);
  if (name.endsWith("/formatting"))
    return { money: (amount) => `S/${Number(amount).toFixed(2)}` };
  if (name.endsWith("/i18n"))
    return {
      t: (key, values = {}) => {
        const text = key
          .split(".")
          .reduce((value, part) => value[part], locale);
        return text.replace(/\{\{(\w+)\}\}/g, (_, field) =>
          String(values[field]),
        );
      },
    };
  throw new Error(`Unexpected import: ${name}`);
}, exports);

function elements(tree, predicate) {
  if (Array.isArray(tree))
    return tree.flatMap((child) => elements(child, predicate));
  if (!tree || typeof tree !== "object") return [];
  if (typeof tree.type === "function")
    return elements(tree.type(tree.props), predicate);
  return [
    ...(predicate(tree) ? [tree] : []),
    ...elements(tree.props?.children, predicate),
  ];
}

test("group charts display only returned categories with readable counts and accessible tooltips", () => {
  const tree = exports.EnrollmentGroupChart({
    data: [
      { id: 4, name: "Kids", count: 3 },
      { id: 8, name: "Tigres", count: 1 },
    ],
  });
  const bars = elements(tree, (element) => element.type === "li");
  assert.equal(bars.length, 2);
  assert.equal(bars[0].props["aria-label"], "Kids: 3 estudiantes inscritos");
  assert.equal(bars[1].props.title, "Tigres: 1 estudiantes inscritos");
  assert.ok(bars.every((bar) => bar.props.tabIndex === 0));
  assert.deepEqual(
    elements(tree, (element) => element.type === "strong").map(
      (element) => element.props.children,
    ),
    [3, 1],
  );
});

test("method percentages use overall collections rather than hiding historical payments", () => {
  const tree = exports.DonutChart({
    centerLabel: "Cobrado",
    centerValue: "S/100.00",
    percentageTotal: 100,
    items: [
      {
        label: "Efectivo",
        value: 20,
        displayValue: "S/20.00",
        color: "#10b981",
      },
      { label: "Yape", value: 30, displayValue: "S/30.00", color: "#7c3aed" },
    ],
  });
  const legends = elements(tree, (element) => element.type === "li");
  assert.match(legends[0].props.title, /S\/20\.00 · 20\s?%/);
  assert.match(legends[1].props.title, /S\/30\.00 · 30\s?%/);
  const donut = elements(tree, (element) => element.props.role === "img")[0];
  assert.match(donut.props.style.background, /#e2e8f0 50% 100%/);
});

test("enrollment and financial charts provide localized empty states", () => {
  for (const tree of [
    exports.EnrollmentGroupChart({ data: [] }),
    exports.DonutChart({
      items: [],
      centerLabel: "",
      centerValue: "",
      percentageTotal: 0,
    }),
    exports.MonthlyRevenueChart({ data: [] }),
  ]) {
    assert.ok(
      elements(
        tree,
        (element) => element.props.children === locale.adminDashboard.noData,
      ).length,
    );
  }
});
