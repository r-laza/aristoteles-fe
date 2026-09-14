import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus, Users, X } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { PasswordInput } from "../auth/PasswordInput";
import { roles, type Role, type User } from "../auth/types";
import { usersApi } from "../services/auth.api";
import { ApiError } from "../services/api";
import { t } from "../lib/i18n";

function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await usersApi.create({
        fullName: String(data.get("fullName")).trim(),
        username: String(data.get("username")).trim(),
        password: String(data.get("password")),
        role: data.get("role") as Role,
      });
      onCreated();
    } catch (error) {
      setError(
        t(
          error instanceof ApiError && error.status === 409
            ? "admin.duplicate"
            : "admin.error",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      aria-labelledby="create-title"
      className="w-[calc(100%-2rem)] max-w-lg rounded-2xl p-6 shadow-xl backdrop:bg-slate-950/50"
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 id="create-title" className="text-xl font-bold text-sky-950">
          {t("admin.create")}
        </h2>
        <button
          disabled={busy}
          onClick={onClose}
          aria-label={t("admin.close")}
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <fieldset disabled={busy} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="field-label">
              {t("admin.fullName")}
            </label>
            <input
              autoFocus
              id="fullName"
              name="fullName"
              required
              maxLength={200}
              autoComplete="name"
              className="field"
            />
          </div>
          <div>
            <label htmlFor="new-username" className="field-label">
              {t("auth.username")}
            </label>
            <input
              id="new-username"
              name="username"
              required
              maxLength={100}
              autoComplete="off"
              className="field"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="field-label">
              {t("auth.password")}
            </label>
            <PasswordInput id="new-password" newPassword />
          </div>
          <div>
            <label htmlFor="new-role" className="field-label">
              {t("auth.role")}
            </label>
            <select
              id="new-role"
              name="role"
              required
              defaultValue="STUDENT"
              className="field"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {t(`roles.${role}`)}
                </option>
              ))}
            </select>
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-xl border px-4 py-2"
          >
            {t("admin.cancel")}
          </button>
          <button disabled={busy} className="primary-button">
            {t(busy ? "admin.saving" : "admin.create")}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  async function load() {
    try {
      setUsers(await usersApi.list());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const summaries = [
    ["admin.total", users.length],
    ["admin.students", users.filter((u) => u.role === "STUDENT").length],
    ["admin.teachers", users.filter((u) => u.role === "TEACHER").length],
  ] as const;
  return (
    <AppLayout
      banner={{
        src: "/images/banner-aristoteles.png",
        alt: t("dashboard.bannerAlt"),
      }}
    >
      <div className="py-5">
        <h1 className="text-3xl font-bold tracking-tight text-sky-950">
          {t("admin.title")}
        </h1>
        <p className="mt-2 text-slate-500">{t("admin.subtitle")}</p>
        <div className="my-8 grid gap-4 sm:grid-cols-3">
          {summaries.map(([label, count]) => (
            <section
              key={label}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <Users className="mb-4 text-cyan-600" size={23} />
              <p className="text-sm text-slate-500">{t(label)}</p>
              <p className="mt-2 text-3xl font-bold text-sky-950">
                {loading || error ? t("admin.unavailable") : count}
              </p>
            </section>
          ))}
        </div>
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-sky-950">
              {t("admin.users")}
            </h2>
            <button
              className="primary-button"
              onClick={() => {
                setSuccess(false);
                setOpen(true);
              }}
            >
              <Plus size={18} />
              {t("admin.create")}
            </button>
          </div>
          {success && (
            <p
              role="status"
              className="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-800"
            >
              {t("admin.success")}
            </p>
          )}
          {loading ? (
            <p role="status">{t("admin.loading")}</p>
          ) : error ? (
            <div role="alert">
              <p>{t("admin.loadError")}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(false);
                  void load();
                }}
                className="mt-3 primary-button"
              >
                {t("dashboard.retry")}
              </button>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <table className="w-full table-fixed text-left text-sm">
                  <thead className="border-b text-slate-500">
                    <tr>
                      {[
                        "admin.name",
                        "auth.username",
                        "auth.role",
                        "admin.status",
                        "admin.createdAt",
                      ].map((key) => (
                        <th
                          key={key}
                          scope="col"
                          className="px-2 py-3 font-medium"
                        >
                          {t(key)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="break-words px-2 py-4 font-medium">
                          {user.fullName}
                        </td>
                        <td className="break-words px-2 py-4">
                          {user.username}
                        </td>
                        <td className="px-2 py-4">{t(`roles.${user.role}`)}</td>
                        <td className="px-2 py-4">
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                          >
                            {t(
                              user.isActive ? "admin.active" : "admin.inactive",
                            )}
                          </span>
                        </td>
                        <td className="px-2 py-4">
                          {new Date(user.createdAt).toLocaleDateString("es-EC")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-3 md:hidden">
                {users.map((user) => (
                  <article
                    key={user.id}
                    className="rounded-xl border border-slate-100 p-4"
                  >
                    <h3 className="break-words font-semibold">
                      {user.fullName}
                    </h3>
                    <dl className="mt-3 space-y-2 text-sm">
                      {[
                        ["auth.username", user.username],
                        ["auth.role", t(`roles.${user.role}`)],
                        [
                          "admin.status",
                          t(user.isActive ? "admin.active" : "admin.inactive"),
                        ],
                        [
                          "admin.createdAt",
                          new Date(user.createdAt).toLocaleDateString("es-EC"),
                        ],
                      ].map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-4">
                          <dt className="text-slate-500">{t(key)}</dt>
                          <dd className="min-w-0 break-words text-right">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                ))}
              </div>
              {users.length === 0 && (
                <p className="py-6 text-center text-slate-500">
                  {t("admin.empty")}
                </p>
              )}
            </>
          )}
        </section>
        {open && (
          <CreateUserModal
            onClose={() => setOpen(false)}
            onCreated={() => {
              setOpen(false);
              setSuccess(true);
              setLoading(true);
              setError(false);
              void load();
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
