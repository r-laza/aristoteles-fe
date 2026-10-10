import type { DashboardResponse } from "../types/dashboard";
import type { AdminDashboardResponse } from "../types/admin-dashboard";
import { api } from "./api";
export const fetchDashboard = () => api<DashboardResponse>("/api/dashboard");
export const fetchAdminDashboard = (cycleId?: number) =>
  api<AdminDashboardResponse | null>(
    `/api/admin/dashboard${cycleId === undefined ? "" : `?cycleId=${cycleId}`}`,
  );
