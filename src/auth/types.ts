export const roles = ["ADMIN", "TEACHER", "STUDENT"] as const;
export type Role = (typeof roles)[number];
export type User = {
  id: number;
  username: string;
  fullName: string;
  role: Role;
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
  isActive: boolean;
  createdAt: string;
  dni?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  representativeName?: string;
  relationship?: "FATHER" | "MOTHER" | "OTHER";
  relationshipOther?: string | null;
  primaryPhone?: string;
  secondaryPhone?: string | null;
  accessIsActive?: boolean | null;
};
export const dashboardPath = (role: Role) =>
  role === "ADMIN" ? "/admin" : role === "TEACHER" ? "/teacher" : "/";
