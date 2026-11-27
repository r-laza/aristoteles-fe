import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { t } from "../lib/i18n";
import { PlaceholderPage } from "./PlaceholderPage";

export function ProfilePage() {
  const { user } = useAuth();
  if (user?.role === "ADMIN") return <Navigate to="/admin/users" replace />;

  return (
    <PlaceholderPage
      title={t("placeholders.profile")}
      description={t("placeholders.description")}
    />
  );
}
