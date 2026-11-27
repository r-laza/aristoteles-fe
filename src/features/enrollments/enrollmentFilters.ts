export type EnrollmentBranch = { id: number; name: string };
export type EnrollmentGroup = { id: number; branch: EnrollmentBranch };
export type EnrollmentRow = {
  branch: EnrollmentBranch;
  group: { id: number };
  student: { fullName: string; dni: string };
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");

export function assignedBranches<T extends EnrollmentBranch>(
  cycle: { branches: { branch: T }[] } | null,
): T[] {
  return cycle?.branches.map(({ branch }) => branch) ?? [];
}

export function groupsForBranch<T extends EnrollmentGroup>(
  groups: T[],
  branchId: string,
): T[] {
  return groups.filter((group) => group.branch.id === Number(branchId));
}

export function filterEnrollmentRows<T extends EnrollmentRow>(
  enrollments: T[],
  branchId: string,
  groupId: string,
  search: string,
): T[] {
  const term = normalize(search.trim());
  return enrollments.filter(
    (enrollment) =>
      enrollment.branch.id === Number(branchId) &&
      (!groupId || enrollment.group.id === Number(groupId)) &&
      (!term ||
        normalize(
          `${enrollment.student.fullName} ${enrollment.student.dni}`,
        ).includes(term)),
  );
}
