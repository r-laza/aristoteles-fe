import { api } from "./api";
import type { Credentials, Person, Role, User } from "../auth/types";
export const authApi = {
  me: () => api<User>("/api/auth/me"),
  login: (credentials: Credentials) =>
    api<User>("/api/auth/login", credentials),
  logout: () => api<void>("/api/auth/logout", {}),
};
export const usersApi = {
  list: () => api<User[]>("/api/admin/users"),
  create: (input: Credentials & { fullName: string }) =>
    api<User>("/api/admin/users", input),
};
export type CreatePersonInput =
  | {
      role: Exclude<Role, "STUDENT">;
      fullName: string;
      username: string;
      password: string;
      isActive: boolean;
    }
  | {
      role: "STUDENT";
      dni: string;
      firstName: string;
      lastName: string;
      birthDate: string;
      gender: "MALE" | "FEMALE" | "OTHER";
      representativeName: string;
      relationship: "FATHER" | "MOTHER" | "OTHER";
      relationshipOther?: string;
      primaryPhone: string;
      secondaryPhone?: string;
      isActive: boolean;
      createAccess: boolean;
      username?: string;
      password?: string;
    };
export const peopleApi = {
  list: () => api<Person[]>("/api/admin/people"),
  create: (input: CreatePersonInput) => api<Person>("/api/admin/people", input),
  updateStudent: (
    id: number,
    input: Omit<
      Extract<CreatePersonInput, { role: "STUDENT" }>,
      "role" | "createAccess" | "username" | "password"
    >,
  ) => api<Person>(`/api/admin/people/students/${id}`, input),
  updateUser: (
    id: number,
    input: {
      fullName: string;
      username: string;
      password?: string;
      isActive: boolean;
    },
  ) => api<Person>(`/api/admin/people/users/${id}`, input),
  manageAccess: (
    id: number,
    input: { username: string; password?: string; isActive: boolean },
  ) => api<Person>(`/api/admin/people/students/${id}/access`, input),
};
