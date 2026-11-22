import type { AcademicCycle } from "../cycles/cycles";
import type { AdminDashboardResponse } from "../../types/admin-dashboard";

type DashboardLoader = () => Promise<AdminDashboardResponse | null>;
type CyclesLoader = () => Promise<AcademicCycle[]>;

export type AdminDashboardLoadResult = {
  cycles: AcademicCycle[] | null;
  dashboard: AdminDashboardResponse | null;
  cyclesFailed: boolean;
  dashboardFailed: boolean;
};

export async function loadAdminDashboardData(
  loadCycles: CyclesLoader,
  loadDashboard: DashboardLoader,
): Promise<AdminDashboardLoadResult> {
  const [cyclesResult, dashboardResult] = await Promise.allSettled([
    loadCycles(),
    loadDashboard(),
  ]);

  return {
    cycles: cyclesResult.status === "fulfilled" ? cyclesResult.value : null,
    dashboard:
      dashboardResult.status === "fulfilled" ? dashboardResult.value : null,
    cyclesFailed: cyclesResult.status === "rejected",
    dashboardFailed: dashboardResult.status === "rejected",
  };
}
