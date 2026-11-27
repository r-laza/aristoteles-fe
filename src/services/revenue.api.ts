import { api } from "./api";

export type RevenueFilters = {
  administratorId?: number;
  cycleId?: number;
  branchId?: number;
  paymentMethod?: "CASH" | "TRANSFER" | "YAPE" | "PLIN";
  from?: string;
  to?: string;
  search?: string;
  page: number;
};

export type RevenueReport = {
  rows: {
    id: number;
    date: string;
    administrator: { id: number; fullName: string } | null;
    student: { id: number; fullName: string; dni: string };
    cycle: { id: number; name: string };
    branch: { id: number; name: string };
    paymentMethod: "CASH" | "TRANSFER" | "YAPE" | "PLIN";
    amount: string;
  }[];
  totals: { amount: string; count: number };
  pagination: { page: number; pageSize: number; total: number; pages: number };
  filters: {
    administrators: { id: number; fullName: string }[];
    cycles: { id: number; name: string }[];
    branches: { id: number; name: string }[];
  };
};

export const revenueApi = {
  report(filters: RevenueFilters) {
    const query = new URLSearchParams({ page: String(filters.page) });
    for (const [key, value] of Object.entries(filters))
      if (key !== "page" && value !== undefined && value !== "")
        query.set(key, String(value));
    return api<RevenueReport>(`/api/admin/revenue?${query}`);
  },
};
