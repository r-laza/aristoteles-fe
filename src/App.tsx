import { PaymentsPage } from "./pages/PaymentsPage";
import { AcademicCycleDetailPage } from "./pages/AcademicCycleDetailPage";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { LoginPage } from "./pages/LoginPage";
import { AcademicCyclesPage } from "./pages/AcademicCyclesPage";
import { AdminPage } from "./pages/AdminPage";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { t } from "./lib/i18n";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute role="STUDENT" />}>
            <Route path="/" element={<DashboardPage />} />
            <Route
              path="/courses"
              element={
                <PlaceholderPage
                  title={t("placeholders.courses")}
                  description={t("placeholders.description")}
                />
              }
            />
            <Route
              path="/tasks"
              element={
                <PlaceholderPage
                  title={t("placeholders.tasks")}
                  description={t("placeholders.description")}
                />
              }
            />
          </Route>
          <Route element={<ProtectedRoute role="ADMIN" />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/payments" element={<PaymentsPage />} />
            <Route path="/admin/users" element={<AdminPage />} />
            <Route path="/admin/cycles" element={<AcademicCyclesPage />} />
            <Route
              path="/admin/cycles/:id"
              element={<AcademicCycleDetailPage />}
            />
          </Route>
          <Route element={<ProtectedRoute role="TEACHER" />}>
            <Route
              path="/teacher"
              element={
                <PlaceholderPage
                  title={t("teacher.title")}
                  description={t("teacher.description")}
                />
              }
            />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route
              path="/profile"
              element={
                <PlaceholderPage
                  title={t("placeholders.profile")}
                  description={t("placeholders.description")}
                />
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
export default App;
