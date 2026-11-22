import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { api, ApiError } from "../src/services/api.ts";
import { loadAdminDashboardData } from "../src/features/dashboard/adminDashboardLoad.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("empty successful HTTP 200 responses are returned as null", async () => {
  globalThis.fetch = async () => new Response(null, { status: 200 });

  assert.equal(await api("/api/admin/dashboard"), null);
});

test("204 and HTTP error behavior is preserved", async () => {
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await api("/api/admin/dashboard"), undefined);

  globalThis.fetch = async () => new Response(null, { status: 500 });
  await assert.rejects(api("/api/admin/dashboard"), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 500);
    return true;
  });
});

test("cycles load when there is no active-cycle dashboard", async () => {
  const upcomingCycle = {
    id: 1,
    name: "Verano",
    startDate: "2027-01-05",
    endDate: "2027-03-02",
  };
  const result = await loadAdminDashboardData(
    async () => [upcomingCycle],
    async () => null,
  );

  assert.deepEqual(result.cycles, [upcomingCycle]);
  assert.equal(result.dashboard, null);
  assert.equal(result.cyclesFailed, false);
  assert.equal(result.dashboardFailed, false);
});

test("successful cycles remain available when the dashboard request fails", async () => {
  const upcomingCycle = { id: 1, name: "Verano" };
  const result = await loadAdminDashboardData(
    async () => [upcomingCycle],
    async () => {
      throw new Error("dashboard unavailable");
    },
  );

  assert.deepEqual(result.cycles, [upcomingCycle]);
  assert.equal(result.dashboard, null);
  assert.equal(result.cyclesFailed, false);
  assert.equal(result.dashboardFailed, true);
});
