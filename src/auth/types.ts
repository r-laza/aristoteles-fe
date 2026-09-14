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
export const dashboardPath = (role: Role) =>
  role === "ADMIN" ? "/admin" : role === "TEACHER" ? "/teacher" : "/";
