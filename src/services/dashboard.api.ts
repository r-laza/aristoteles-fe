import type { DashboardResponse } from "../types/dashboard";
import type { AdminDashboardResponse, DashboardStudentFinance, DashboardFilters, DebtorDetail, Paginated } from "../types/admin-dashboard";
import { api } from "./api";
export const fetchDashboard = () => api<DashboardResponse>("/api/dashboard");
const query = (filters: DashboardFilters, extra: Record<string, string | number> = {}) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, ...extra }))
    if (value !== undefined && String(value) !== "") params.set(key, String(value));
  return params.size ? `?${params.toString()}` : "";
};
export const fetchAdminDashboard = (filters: DashboardFilters = {}) => api<AdminDashboardResponse>(`/api/admin/dashboard${query(filters)}`);
export const fetchDashboardPayments = (filters: DashboardFilters, page: number, search: string) => api<Paginated<DashboardStudentFinance>>(`/api/admin/dashboard/payments${query(filters, { page, search })}`);
export const fetchDashboardDebtors = (filters: DashboardFilters, page: number, search: string) => api<Paginated<DashboardStudentFinance>>(`/api/admin/dashboard/debtors${query(filters, { page, search })}`);
export const fetchDashboardPending = (filters: DashboardFilters, page: number, search: string) => api<Paginated<DashboardStudentFinance>>(`/api/admin/dashboard/pending${query(filters, { page, search })}`);
export async function downloadDashboardDebtors(filters: DashboardFilters, search: string) {
  const response = await fetch(`/api/admin/dashboard/debtors/export${query(filters, { search })}`, { credentials: "same-origin" });
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event("auth-expired"));
    throw new Error(`Export failed: ${response.status}`);
  }
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const filename = disposition.match(/filename="?([^";]+)"?/)?.[1] ?? "estudiantes_morosos.xlsx";
  return { blob: await response.blob(), filename };
}
export const fetchDashboardDebtor = (enrollmentId: number, filters: DashboardFilters) => api<DebtorDetail>(`/api/admin/dashboard/debtors/${enrollmentId}${query(filters)}`);
