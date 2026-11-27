import { useRef, useState, type FormEvent } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../auth/useAuth";
import { authApi } from "../services/auth.api";
import { ApiError } from "../services/api";
import { t } from "../lib/i18n";
import { PlaceholderPage } from "./PlaceholderPage";

export function ProfilePage() {
  const { user, refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  if (!user || user.role !== "ADMIN")
    return (
      <PlaceholderPage
        title={t("placeholders.profile")}
        description={t("placeholders.description")}
      />
    );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    submitting.current = true;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await authApi.updateProfile({
        fullName: String(data.get("fullName")).trim(),
        username: String(data.get("username")).trim(),
        currentPassword: String(data.get("currentPassword") ?? ""),
        password: String(data.get("password") ?? "") || undefined,
      });
      form.reset();
      try {
        await refresh();
        setSuccess(t("profile.saved"));
      } catch {
        setSuccess(t("profile.saved"));
        setError(t("profile.refreshError"));
      }
    } catch (cause) {
      setError(
        t(
          cause instanceof ApiError && cause.code === "PROFILE_PASSWORD_INVALID"
            ? "profile.invalidPassword"
            : cause instanceof ApiError &&
                cause.code === "PROFILE_USERNAME_DUPLICATE"
              ? "admin.duplicate"
              : "profile.saveError",
        ),
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl py-5">
        <h1 className="text-3xl font-bold text-sky-950">
          {t("navigation.profile")}
        </h1>
        <p className="mt-2 text-slate-500">{t("profile.subtitle")}</p>
        <form
          onSubmit={(event) => void submit(event)}
          className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <fieldset disabled={busy} className="space-y-4">
            <label className="block">
              <span className="field-label">{t("admin.fullName")}</span>
              <input
                name="fullName"
                className="field"
                required
                maxLength={200}
                defaultValue={user.fullName}
              />
            </label>
            <label className="block">
              <span className="field-label">{t("auth.username")}</span>
              <input
                name="username"
                className="field"
                required
                maxLength={100}
                autoComplete="username"
                defaultValue={user.username}
              />
            </label>
            <label className="block">
              <span className="field-label">
                {t("profile.currentPassword")}
              </span>
              <input
                name="currentPassword"
                type="password"
                className="field"
                maxLength={256}
                autoComplete="current-password"
              />
            </label>
            <label className="block">
              <span className="field-label">
                {t("admin.newPasswordOptional")}
              </span>
              <input
                name="password"
                type="password"
                className="field"
                maxLength={256}
                autoComplete="new-password"
              />
            </label>
            <p className="text-sm text-slate-500">
              {t("profile.passwordHelp")}
            </p>
          </fieldset>
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">
              {error}
            </p>
          )}
          {success && (
            <p
              role="status"
              className="rounded-xl bg-emerald-50 p-3 text-emerald-800"
            >
              {success}
            </p>
          )}
          <button disabled={busy} className="primary-button w-full sm:w-auto">
            {t(busy ? "admin.saving" : "profile.save")}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
