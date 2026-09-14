import { useEffect, useState, type ReactNode } from "react";
import { authApi } from "../services/auth.api";
import { ApiError } from "../services/api";
import type { User } from "./types";
import { AuthContext } from "./useAuth";
import { t } from "../lib/i18n";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  async function restore() {
    try {
      setUser(await authApi.me());
    } catch (error) {
      setUser(null);
      setError(!(error instanceof ApiError && error.status === 401));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void restore();
    const expire = () => setUser(null);
    window.addEventListener("auth-expired", expire);
    return () => window.removeEventListener("auth-expired", expire);
  }, []);
  const value = {
    user,
    loading,
    login: async (input: import("./types").Credentials) => {
      setUser(await authApi.login(input));
    },
    logout: async () => {
      await authApi.logout();
      setUser(null);
    },
  };
  return (
    <AuthContext.Provider value={value}>
      {error ? (
        <div className="grid min-h-screen place-content-center gap-4 p-6 text-center">
          <p role="alert">{t("auth.connectionError")}</p>
          <button
            className="primary-button"
            onClick={() => {
              setLoading(true);
              setError(false);
              void restore();
            }}
          >
            {t("dashboard.retry")}
          </button>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
