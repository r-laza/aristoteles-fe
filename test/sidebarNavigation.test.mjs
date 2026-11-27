import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const source = (path) =>
  readFile(new URL(`../src/${path}`, import.meta.url), "utf8");

test("admin sidebar keeps Inicio standalone above the three sections", async () => {
  const sidebar = await source("components/layout/Sidebar.tsx");
  const home = sidebar.indexOf("item={home}");
  const sections = sidebar.indexOf("{adminSections.map");

  assert.ok(home >= 0 && sections > home);
  assert.match(sidebar, /min-h-11 items-center rounded-xl text-sm font-medium/);
  assert.match(sidebar, /canManageAdministrators\(user\) &&/);
});

test("admin modules use the requested section order without duplication", async () => {
  const [sidebar, translations] = await Promise.all([
    source("components/layout/Sidebar.tsx"),
    source("locales/es.json"),
  ]);
  for (const section of ["administration", "studentManagement", "academic"])
    assert.match(sidebar, new RegExp(`id: "${section}"`));
  assert.ok(
    sidebar.indexOf('id: "administration"') <
      sidebar.indexOf('id: "studentManagement"') &&
      sidebar.indexOf('id: "studentManagement"') <
        sidebar.indexOf('id: "academic"'),
  );
  assert.doesNotMatch(sidebar, /id: "operation"|id: "account"/);
  assert.match(translations, /"studentManagement": "Gestión de estudiantes"/);
  assert.match(translations, /"administration": "Administración"/);
  for (const route of [
    "/admin/payments",
    "/admin/users",
    "/admin/groups",
    "/admin/cycles",
    "/admin/enrollments-pensions",
    "/admin/branches",
    "/profile",
  ])
    assert.match(sidebar, new RegExp(route.replaceAll("/", "\\/")));
  assert.match(sidebar, /aria-expanded=\{isExpanded\}/);
  assert.match(sidebar, /aria-controls=\{`sidebar-\$\{section\.id\}-items`\}/);
  assert.match(sidebar, /overflow-y-auto overscroll-contain/);
});

test("sidebar derives one active item from the current URL", async () => {
  const sidebar = await source("components/layout/Sidebar.tsx");
  assert.match(sidebar, /function activeAdminPath/);
  assert.match(sidebar, /useLocation\(\)/);
  assert.match(sidebar, /activePath === item\.to/);
  assert.match(sidebar, /aria-current=\{isActive \? "page" : undefined\}/);
  assert.match(sidebar, /pathname === "\/admin\/enrollments"/);
  assert.doesNotMatch(sidebar, /returnTo.*enrollments/);
  assert.match(sidebar, /pathname\.startsWith\(`\$\{path\}\/`\)/);
  assert.doesNotMatch(sidebar, /<NavLink/);
});

test("accordion state is toggled only by its own header", async () => {
  const sidebar = await source("components/layout/Sidebar.tsx");
  assert.match(sidebar, /\[sectionId\]: !current\[sectionId\]/);
  assert.match(sidebar, /studentManagement: true/);
  assert.match(sidebar, /academic: false/);
  assert.match(sidebar, /administration: false/);
  assert.match(sidebar, /localStorage\.getItem\(EXPANDED_SECTIONS_KEY\)/);
  assert.match(sidebar, /localStorage\.setItem\([\s\S]*?EXPANDED_SECTIONS_KEY/);
  assert.match(sidebar, /useState<ExpandedSections>\(\s*readExpandedSections/);
  assert.match(sidebar, /event\.stopPropagation\(\)/);
  assert.doesNotMatch(sidebar, /useEffect/);
});

test("Inscripciones reuses the standard navigation item styling", async () => {
  const sidebar = await source("components/layout/Sidebar.tsx");
  assert.match(sidebar, /label: t\("navigation\.enrollments"\)/);
  assert.match(sidebar, /icon: ClipboardCheck/);
  assert.match(sidebar, /to: "\/admin\/enrollments"/);
  assert.doesNotMatch(sidebar, /min-h-14/);
  assert.doesNotMatch(sidebar, /shadow-sm transition.*activePath/);
});

test("Inscripciones route renders the centralized enrollment module", async () => {
  const [app, page] = await Promise.all([
    source("App.tsx"),
    source("pages/EnrollmentsPage.tsx"),
  ]);
  assert.match(app, /path="\/admin\/enrollments"/);
  assert.match(page, /enrollmentsModule\.title/);
  assert.match(page, /cycleApi\.enrollments\(cycleId\)/);
  assert.match(page, /EnrollmentConfirmation/);
  assert.doesNotMatch(page, /\/admin\/cycles\/\$\{cycleId\}\/enrollments/);
});
