import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import ts from "typescript";
import {
  newestPaymentsFirst,
  PAYMENT_HIGHLIGHT_MS,
  uploadPaymentEvidence,
} from "../src/features/payments/paymentFeedback.ts";

const require = createRequire(import.meta.url);
const source = (path) =>
  readFile(new URL(`../src/${path}`, import.meta.url), "utf8");
const settle = () => new Promise((resolve) => setImmediate(resolve));
const row = {
  id: 7,
  cycle: "Cycle",
  balance: "100.00",
  student: {
    fullName: "Student",
    representativeName: "Payer",
    relationship: "FATHER",
  },
  group: { name: "Group" },
  obligations: [
    {
      paymentType: "ENROLLMENT",
      period: null,
      balance: "100.00",
      amountDue: "100.00",
    },
  ],
};
const payment = {
  id: 42,
  createdAt: "2026-11-26T12:00:00Z",
  paymentDate: "2026-11-26",
  amount: "100.00",
};
const registration = { payments: [payment], totalAmount: "100.00" };

// Render the real components with deterministic hooks and mocked API boundaries.
async function componentHarness(path, mocks, environment = {}) {
  const slots = [];
  let cursor = 0;
  let effects = [];
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots))
        slots[index] = typeof initial === "function" ? initial() : initial;
      return [
        slots[index],
        (value) => {
          slots[index] =
            typeof value === "function" ? value(slots[index]) : value;
        },
      ];
    },
    useRef(initial) {
      const index = cursor++;
      slots[index] ??= { current: initial };
      return slots[index];
    },
    useMemo(callback) {
      return callback();
    },
    useEffect(callback, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
        effects.push(() => {
          previous?.cleanup?.();
          slots[index] = { deps, cleanup: callback() };
        });
      }
    },
  };
  const compiled = ts.transpileModule(await source(path), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const exports = {};
  const load = (name) => {
    if (name === "react") return react;
    if (name === "react/jsx-runtime") return require(name);
    if (name in mocks) return mocks[name];
    throw new Error(`Unexpected import: ${name}`);
  };
  new Function("require", "exports", "FormData", "window", compiled)(
    load,
    exports,
    environment.FormData ?? FormData,
    environment.window,
  );
  return {
    render(name, props) {
      cursor = 0;
      effects = [];
      const tree = exports[name](props);
      effects.forEach((effect) => effect());
      return tree;
    },
  };
}

function nodes(tree, predicate) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree))
    return tree.flatMap((child) => nodes(child, predicate));
  return [
    ...(predicate(tree) ? [tree] : []),
    ...nodes(tree.props?.children, predicate),
  ];
}
const common = {
  "../../lib/i18n": { t: (key) => key },
  "../cycles/cycles": {
    todayKey: () => "2026-11-26",
    formatCycleDate: (date) => date,
  },
  "./formatting": { money: (value) => value, periodLabel: (value) => value },
};

test("registration waits for confirmation, blocks rapid duplicates, and preserves fields after failure", async () => {
  let resolve;
  let reject;
  let calls = 0;
  const saved = [];
  const api = {
    register: () => {
      calls++;
      return new Promise((success, failure) => {
        resolve = success;
        reject = failure;
      });
    },
  };
  class ApiError extends Error {}
  const harness = await componentHarness(
    "features/payments/RegisterPayment.tsx",
    {
      ...common,
      "../../services/payments.api": { paymentsApi: api, methods: ["CASH"] },
      "../../services/api": { ApiError },
      "./payerValidation": {
        payerFieldValue: (value) => value ?? "",
        validatePayerInformation: () => ({}),
      },
    },
    {
      FormData: class {
        get(name) {
          return (
            {
              payerName: "Entered payer",
              payerDocumentNumber: "12345678",
              notes: "",
              paymentDate: "2026-11-26",
            }[name] ?? ""
          );
        }
      },
    },
  );
  const props = { row, onCancel() {}, onSaved: (...args) => saved.push(args) };
  const submit = () =>
    harness
      .render("RegisterPayment", props)
      .props.onSubmit({ preventDefault() {}, currentTarget: {} });
  submit();
  submit();
  assert.equal(calls, 1);
  assert.equal(saved.length, 0);
  reject(new Error("Request failed"));
  await settle();
  let tree = harness.render("RegisterPayment", props);
  assert.ok(nodes(tree, (node) => node.props?.role === "alert").length);
  assert.equal(
    nodes(tree, (node) => node.props?.name === "amount")[0]?.props.value,
    "100.00",
  );
  submit();
  assert.equal(calls, 2);
  resolve(registration);
  await settle();
  assert.equal(saved[0][0], registration);
  submit();
  assert.equal(calls, 2, "confirmed payment cannot be submitted again");
});

test("confirmed registration opens history and refreshes balances without leaving enrollment", async () => {
  const RegisterPayment = () => null;
  const PaymentHistory = () => null;
  let balanceCalls = 0;
  const api = {
    balances: async () => {
      balanceCalls++;
      return {
        rows: [
          {
            ...row,
            balance: balanceCalls === 1 ? "100.00" : "0.00",
            amountPaid: "100.00",
            obligations: [],
          },
        ],
      };
    },
  };
  const harness = await componentHarness("pages/RegisterPaymentPage.tsx", {
    "lucide-react": { ArrowLeft: () => null },
    "react-router-dom": {
      Link: () => null,
      useNavigate: () => () => assert.fail("must not navigate"),
      useParams: () => ({ enrollmentId: "7" }),
      useSearchParams: () => [new URLSearchParams("cycleId=3")],
    },
    "../components/layout/AppLayout": { AppLayout: () => null },
    "../features/cycles/cycles": { readCycles: async () => [] },
    "../features/payments/RegisterPayment": { RegisterPayment },
    "../features/payments/PaymentDialog": { PaymentDialog: () => null },
    "../features/payments/PaymentHistory": { PaymentHistory },
    "../features/payments/paymentFeedback": { uploadPaymentEvidence },
    "../features/payments/receiptPdf": {},
    "../features/payments/formatting": { money: (value) => value },
    "../lib/i18n": { t: (key) => key },
    "../services/payments.api": { paymentsApi: api },
  });
  harness.render("RegisterPaymentPage");
  await settle();
  let tree = harness.render("RegisterPaymentPage");
  const form = nodes(tree, (node) => node.type === RegisterPayment)[0];
  form.props.onBusyChange(true);
  tree = harness.render("RegisterPaymentPage");
  assert.ok(
    nodes(tree, (node) => node.props?.role === "tab").every(
      (tab) => tab.props.disabled,
    ),
    "tabs cannot remount the form during submission",
  );
  form.props.onSaved(registration);
  form.props.onBusyChange(false);
  tree = harness.render("RegisterPaymentPage");
  assert.equal(nodes(tree, (node) => node.type === RegisterPayment).length, 0);
  const history = nodes(tree, (node) => node.type === PaymentHistory)[0];
  assert.equal(history.props.row.id, row.id);
  assert.equal(history.props.recentPayments, registration.payments);
  assert.equal(history.props.version, 1);
  assert.ok(
    nodes(
      tree,
      (node) =>
        node.props?.role === "status" &&
        node.props.children === "payments.success",
    ).length,
  );
  await settle();
  tree = harness.render("RegisterPaymentPage");
  assert.equal(balanceCalls, 2);
  assert.equal(
    nodes(tree, (node) => node.type === PaymentHistory)[0].props.row.balance,
    "0.00",
  );
});

test("history refresh sorts by creation time and removes highlighting after five seconds", async () => {
  let timer;
  let delay;
  let calls = 0;
  const old = {
    ...payment,
    id: 1,
    createdAt: "2026-11-25T12:00:00Z",
    paymentDate: "2026-11-27",
  };
  const harness = await componentHarness(
    "features/payments/PaymentHistory.tsx",
    {
      ...common,
      "lucide-react": {},
      "../../services/payments.api": {
        paymentsApi: {
          history: async () => {
            calls++;
            return [old, payment];
          },
        },
      },
      "./ReceiptDialog": { ReceiptDialog: () => null },
      "./receiptPdf": {},
      "./paymentFeedback": { newestPaymentsFirst, PAYMENT_HIGHLIGHT_MS },
    },
    {
      window: {
        setTimeout(callback, ms) {
          timer = callback;
          delay = ms;
          return 1;
        },
        clearTimeout() {},
      },
    },
  );
  const props = { row, recentPayments: registration.payments, version: 1 };
  harness.render("PaymentHistory", props);
  await settle();
  harness.render("PaymentHistory", props);
  let tree = harness.render("PaymentHistory", props);
  let rows = nodes(tree, (node) => node.type === "tr" && node.key !== null);
  assert.deepEqual(
    rows.map((node) => node.key),
    ["42", "1"],
  );
  assert.equal(rows[0].props.className, "payment-new-highlight");
  assert.equal(delay, 5000);
  timer();
  tree = harness.render("PaymentHistory", props);
  assert.equal(
    nodes(tree, (node) => node.key === "42")[0].props.className,
    undefined,
  );
  harness.render("PaymentHistory", { ...props, version: 2 });
  await settle();
  assert.equal(calls, 2);
  const css = await source("index.css");
  assert.match(css, /animation: payment-highlight 5s ease-out forwards/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*steps\(1, end\)/);
});

test("voucher retries target only failed saved payment IDs", async () => {
  const calls = [];
  const file = new File(["voucher"], "voucher.pdf", {
    type: "application/pdf",
  });
  const failed = await uploadPaymentEvidence([42, 43], file, async (id) => {
    calls.push(id);
    if (id === 43) throw new Error("Upload failed");
    return payment;
  });
  assert.deepEqual(failed, [43]);
  const remaining = await uploadPaymentEvidence(failed, file, async (id) => {
    calls.push(id);
    return payment;
  });
  assert.deepEqual(calls, [42, 43, 43]);
  assert.deepEqual(remaining, []);
});
