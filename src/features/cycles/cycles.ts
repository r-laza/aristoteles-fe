import { api } from "../../services/api";
export type AcademicCycle = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  baseFee: number;
  students: number;
  groups: number;
};
export type CycleStatus = "active" | "upcoming" | "finished";

// Date-only values are compared without UTC conversion, including both endpoints.
export function todayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function cycleStatus(cycle: AcademicCycle, today: string): CycleStatus {
  if (cycle.startDate > today) return "upcoming";
  return cycle.endDate < today ? "finished" : "active";
}
export function orderCycles(
  cycles: AcademicCycle[],
  today: string,
): AcademicCycle[] {
  const rank = { active: 0, upcoming: 1, finished: 2 };
  return [...cycles].sort((a, b) => {
    const statusA = cycleStatus(a, today);
    const statusB = cycleStatus(b, today);
    return (
      rank[statusA] - rank[statusB] ||
      (statusA === "upcoming"
        ? a.startDate.localeCompare(b.startDate)
        : b.endDate.localeCompare(a.endDate)) ||
      a.name.localeCompare(b.name)
    );
  });
}
type CycleResponse = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  baseEnrollmentAmount: string;
  _count: { enrollments: number; groups: number };
};
function mapCycle(cycle: CycleResponse): AcademicCycle {
  return {
    id: cycle.id,
    name: cycle.name,
    startDate: cycle.startDate.slice(0, 10),
    endDate: cycle.endDate.slice(0, 10),
    baseFee: Number(cycle.baseEnrollmentAmount),
    students: cycle._count.enrollments,
    groups: cycle._count.groups,
  };
}
export async function readCycles(): Promise<AcademicCycle[]> {
  return (await api<CycleResponse[]>("/api/admin/cycles")).map(mapCycle);
}
export async function getCycle(id: string): Promise<AcademicCycle> {
  return mapCycle(await api<CycleResponse>(`/api/admin/cycles/${id}`));
}
export async function saveCycle(cycle: {
  name: string;
  startDate: string;
  endDate: string;
  baseFee: number;
}): Promise<AcademicCycle> {
  return mapCycle(
    await api<CycleResponse>("/api/admin/cycles", {
      name: cycle.name,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      baseEnrollmentAmount: cycle.baseFee,
    }),
  );
}
export type CycleGroup = {
  id: number;
  name: string;
  _count: { enrollments: number };
};
export type CycleEnrollment = {
  id: number;
  student: { id: number; fullName: string; username: string };
  group: { id: number; name: string };
  baseAmount: string;
  discountAmount: string;
  discountReason: string | null;
  finalAmount: string;
  status: "ACTIVE";
};
export type AvailableStudent = {
  id: number;
  fullName: string;
  username: string;
};
export const cycleApi = {
  groups: (id: string) => api<CycleGroup[]>(`/api/admin/cycles/${id}/groups`),
  createGroup: (id: string, name: string) =>
    api(`/api/admin/cycles/${id}/groups`, { name }),
  available: (id: string) =>
    api<AvailableStudent[]>(`/api/admin/cycles/${id}/available-students`),
  enrollments: (id: string) =>
    api<CycleEnrollment[]>(`/api/admin/cycles/${id}/enrollments`),
  enroll: (
    id: string,
    input: {
      studentId: number;
      groupId: number;
      discountAmount: string;
      discountReason: string;
    },
  ) => api(`/api/admin/cycles/${id}/enrollments`, input),
};
export function formatCycleDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
