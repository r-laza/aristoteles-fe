import { api } from "./api";
import type { Credentials, User } from "../auth/types";
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
