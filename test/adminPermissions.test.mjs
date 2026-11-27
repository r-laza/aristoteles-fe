import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { canManageAdministrators } from "../src/auth/types.ts";

const require = createRequire(import.meta.url);
const locale = JSON.parse(
  await readFile(new URL("../src/locales/es.json", import.meta.url), "utf8"),
);
const staff = [
  {
    id: 1,
    kind: "USER",
    fullName: "Main account",
    role: "ADMIN",
    adminLevel: "MAIN",
    isActive: true,
    username: "main",
    createdAt: "2026-11-01",
  },
  {
    id: 2,
    kind: "USER",
    fullName: "Regular account",
    role: "ADMIN",
    adminLevel: "REGULAR",
    isActive: true,
    username: "regular",
    createdAt: "2026-11-01",
  },
];
const code = ts.transpileModule(
  await readFile(
    new URL("../src/pages/AdminPage.tsx", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  },
).outputText;
function renderPeople(actor) {
  let firstBoolean = true;
  const exports = {};
  const react = require("react");
  const mocks = {
    react: {
      ...react,
      useEffect() {},
      useState(initial) {
        const value = Array.isArray(initial)
          ? staff
          : initial === "STUDENT"
            ? actor.adminLevel === "MAIN" ? "ADMIN" : "STUDENT"
            : initial === true
              ? firstBoolean
              : initial;
        if (initial === true) firstBoolean = false;
        return [value, () => {}];
      },
    },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "lucide-react": require("lucide-react"),
    "../components/layout/AppLayout": { AppLayout: ({ children }) => children },
    "../auth/PasswordInput": {},
    "../auth/types": { canManageAdministrators },
    "../auth/useAuth": { useAuth: () => ({ user: actor }) },
    "../services/auth.api": {},
    "../services/api": {},
    "../lib/i18n": {
      t: (key) => key.split(".").reduce((value, part) => value[part], locale),
    },
    "../features/admin/personValidation": {},
  };
  new Function("require", "exports", code)((name) => {
    if (!(name in mocks)) throw new Error(`Unexpected import: ${name}`);
    return mocks[name];
  }, exports);
  return renderToStaticMarkup(react.createElement(exports.AdminPage));
}

test("only active Main administrators possess administrator-management permission", () => {
  assert.equal(canManageAdministrators(staff[0]), true);
  for (const user of [
    staff[1],
    { ...staff[0], isActive: false },
    { ...staff[0], role: "TEACHER" },
    null,
  ]) {
    assert.equal(canManageAdministrators(user), false);
  }
});

test("regular administrators see only student management", () => {
  const html = renderPeople(staff[1]);
  assert.doesNotMatch(html, /Main account|Regular account/);
  assert.match(html, new RegExp(locale.admin.students));
  assert.doesNotMatch(html, new RegExp(locale.admin.teachers));
  assert.doesNotMatch(html, new RegExp(locale.admin.administrators));
  assert.match(html, /role="tab"/);
  assert.doesNotMatch(html, new RegExp(locale.admin.createByRole.ADMIN));
  assert.doesNotMatch(html, new RegExp(locale.admin.editPerson));
});

test("Main administrators see administrator creation and both desktop/mobile editing actions", () => {
  const html = renderPeople(staff[0]);
  assert.match(html, new RegExp(locale.admin.createByRole.ADMIN));
  assert.match(html, new RegExp(locale.admin.editPerson));
  assert.match(html, new RegExp(locale.admin.levels.MAIN));
});
