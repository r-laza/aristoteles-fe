import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";
import { dashboardPath, type AdminLevel, type Role } from "./types";
import { t } from "../lib/i18n";
export function ProtectedRoute({
  role,
  adminLevel,
}: {
  role?: Role;
  adminLevel?: AdminLevel;
}) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div
        role="status"
        className="grid min-h-screen place-items-center text-sky-950"
      >
        {t("auth.loading")}
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (
    (role && user.role !== role) ||
    (adminLevel && user.adminLevel !== adminLevel)
  )
    return <Navigate to={dashboardPath(user)} replace />;
  return <Outlet />;
}
