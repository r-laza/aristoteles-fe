import { api } from "../../services/api";
export type AcademicCycle = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
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
  _count: { enrollments: number; groups: number };
};
function mapCycle(cycle: CycleResponse): AcademicCycle {
  return {
    id: cycle.id,
    name: cycle.name,
    startDate: cycle.startDate.slice(0, 10),
    endDate: cycle.endDate.slice(0, 10),
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
export type GroupAssignment = { groupId: number; feeId: number | null };
export async function saveCycle(
  cycle: {
    groups: GroupAssignment[];
    name: string;
    startDate: string;
    endDate: string;
  },
  id?: number,
): Promise<AcademicCycle> {
  return mapCycle(
    await api<CycleResponse>(
      id ? `/api/admin/cycles/${id}` : "/api/admin/cycles",
      {
        groups: cycle.groups.map(({ groupId, feeId }) => ({
          groupId,
          feeIds: feeId === null ? [] : [feeId],
        })),
        name: cycle.name,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
      },
    ),
  );
}
export type CatalogGroup = ReusableGroup & { _count: { cycles: number } };
export type ReusableGroup = { id: number; name: string };
export type CatalogFee = EnrollmentFee & {
  _count: { cycleGroups: number; enrollments: number };
};
export type EnrollmentFee = {
  id: number;
  name: string;
  amount: string;
  validFrom: string;
  validUntil: string | null;
};
export function feeAvailable(
  fee: EnrollmentFee,
  today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()),
) {
  return (
    fee.validFrom.slice(0, 10) <= today &&
    (!fee.validUntil || fee.validUntil.slice(0, 10) >= today)
  );
}
export type CycleGroup = {
  reusableGroupId: number;
  fees: EnrollmentFee[];
  id: number;
  name: string;
  _count: { enrollments: number };
};
export type CycleEnrollment = {
  id: number;
  student: { id: number; fullName: string; username: string };
  group: { id: number; name: string };
  fee: EnrollmentFee;
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
  deleteCycle: (id: number) =>
    api<{ id: number }>(`/api/admin/cycles/${id}/delete`, {}),
  groups: (id: string) => api<CycleGroup[]>(`/api/admin/cycles/${id}/groups`),
  deleteGroup: (id: number) =>
    api<{ id: number }>(`/api/admin/groups/${id}/delete`, {}),
  reusableGroups: () => api<CatalogGroup[]>("/api/admin/groups"),
  saveGroup: (name: string, id?: number) =>
    api<ReusableGroup>(id ? `/api/admin/groups/${id}` : "/api/admin/groups", {
      name,
    }),
  deleteFee: (id: number) =>
    api<{ id: number }>(`/api/admin/fees/${id}/delete`, {}),
  reusableFees: () => api<CatalogFee[]>("/api/admin/fees"),
  saveFee: (
    input: {
      name: string;
      amount: string;
      validFrom: string;
      validUntil: string;
    },
    id?: number,
  ) =>
    api<EnrollmentFee>(id ? `/api/admin/fees/${id}` : "/api/admin/fees", input),
  available: (id: string) =>
    api<AvailableStudent[]>(`/api/admin/cycles/${id}/available-students`),
  enrollments: (id: string) =>
    api<CycleEnrollment[]>(`/api/admin/cycles/${id}/enrollments`),
  enroll: (
    id: string,
    input: {
      studentId: number;
      groupId: number;
      feeId: number;
      discountAmount: string;
      discountReason: string;
    },
  ) => api(`/api/admin/cycles/${id}/enrollments`, input),
};
export function formatCycleDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
