export const roles = ["ADMIN", "TEACHER", "STUDENT"] as const;
export type Role = (typeof roles)[number];
export type AdminLevel = "MAIN" | "REGULAR";
export type User = {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  adminLevel: AdminLevel;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
export type Credentials = { username: string; password: string; role: Role };
export type Person = {
  id: number;
  kind: "STUDENT" | "USER";
  fullName: string;
  username: string | null;
  role: Role;
  adminLevel?: AdminLevel;
  isActive: boolean;
  createdAt: string;
  dni?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  representativeName?: string;
  representativeDocumentType?: "DNI" | "CE" | "PASSPORT";
  representativeDocumentNumber?: string;
  relationship?: "FATHER" | "MOTHER" | "OTHER";
  relationshipOther?: string | null;
  primaryPhone?: string;
  secondaryPhone?: string | null;
  accessIsActive?: boolean | null;
};
export const canManageAdministrators = (user: User | null) =>
  Boolean(
    user?.isActive && user.role === "ADMIN" && user.adminLevel === "MAIN",
  );
export const dashboardPath = (
  identity: Role | Pick<User, "role" | "adminLevel">,
) => {
  const role = typeof identity === "string" ? identity : identity.role;
  if (role === "ADMIN")
    return typeof identity !== "string" && identity.adminLevel === "REGULAR"
      ? "/admin/enrollments"
      : "/admin";
  return role === "TEACHER" ? "/teacher" : "/";
};
