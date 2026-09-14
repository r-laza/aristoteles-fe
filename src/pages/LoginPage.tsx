import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { ShieldCheck, GraduationCap, BookOpen } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { dashboardPath, roles, type Role } from "../auth/types";
import { PasswordInput } from "../auth/PasswordInput";
import { ApiError } from "../services/api";
import { t } from "../lib/i18n";
const icons = { ADMIN: ShieldCheck, TEACHER: GraduationCap, STUDENT: BookOpen };
export function LoginPage() {
  const { user, loading, login } = useAuth();
  const [role, setRole] = useState<Role>("STUDENT");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      await login({
        username: String(data.get("username")).trim(),
        password: String(data.get("password")),
        role,
      });
    } catch (error) {
      setError(
        t(
          error instanceof ApiError && [400, 401].includes(error.status)
            ? "auth.error"
            : "auth.connectionError",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <div role="status" className="grid min-h-screen place-items-center">
        {t("auth.loading")}
      </div>
    );
  if (user) return <Navigate to={dashboardPath(user.role)} replace />;
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-sky-950 via-sky-900 to-cyan-700 px-4 py-10">
      <section className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-10">
        <img
          src="/images/acedemy.png"
          alt={t("app.name")}
          className="mx-auto mb-8 w-52"
        />
        <h1 className="text-center text-3xl font-bold text-sky-950">
          {t("auth.title")}
        </h1>
        <p className="mt-2 text-center text-slate-500">{t("auth.subtitle")}</p>
        <form
          onSubmit={(event) => void submit(event)}
          className="mt-7 space-y-5"
        >
          <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-3">
            <legend className="sr-only">{t("auth.role")}</legend>
            {roles.map((value) => {
              const Icon = icons[value];
              return (
                <label
                  key={value}
                  className={`relative flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition sm:flex-col sm:text-center ${role === value ? "border-cyan-500 bg-cyan-50 text-sky-950" : "border-slate-100 text-slate-500 hover:border-sky-200"}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={role === value}
                    onChange={() => setRole(value)}
                    className="sr-only peer"
                  />
                  <Icon size={25} />
                  <span className="font-semibold peer-focus-visible:underline">
                    {t(`roles.${value}`)}
                  </span>
                  <span className="text-xs sm:min-h-8">
                    {t(`auth.${value}`)}
                  </span>
                </label>
              );
            })}
          </fieldset>
          <div>
            <label htmlFor="username" className="field-label">
              {t("auth.username")}
            </label>
            <input
              id="username"
              name="username"
              required
              maxLength={100}
              autoComplete="username"
              className="field"
            />
          </div>
          <div>
            <label htmlFor="password" className="field-label">
              {t("auth.password")}
            </label>
            <PasswordInput />
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <button disabled={busy} className="primary-button w-full">
            {t(busy ? "auth.submitting" : "auth.submit")}
          </button>
        </form>
      </section>
    </main>
  );
}
