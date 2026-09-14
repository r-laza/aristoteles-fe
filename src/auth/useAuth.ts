import { createContext, useContext } from "react";
import type { Credentials, User } from "./types";
type AuthState = {
  user: User | null;
  loading: boolean;
  login: (input: Credentials) => Promise<void>;
  logout: () => Promise<void>;
};
export const AuthContext = createContext<AuthState | null>(null);
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider missing");
  return context;
}
