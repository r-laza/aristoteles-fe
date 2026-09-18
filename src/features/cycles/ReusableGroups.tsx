import { useEffect, useState } from "react";
import { Pencil, Search, Trash2, Users } from "lucide-react";
import { t } from "../../lib/i18n";
import { ApiError } from "../../services/api";
import { CycleModal } from "./CycleModal";
import { GroupForm } from "./GroupForms";
import { cycleApi, type CatalogGroup } from "./cycles";

function DeleteGroupModal({
  group,
  onClose,
  onDeleted,
}: {
  group: CatalogGroup;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [inUse, setInUse] = useState(group._count.cycles > 0);
  const [error, setError] = useState("");
  async function remove() {
    if (busy || inUse) return;
    setBusy(true);
    setError("");
    try {
      await cycleApi.deleteGroup(group.id);
      onDeleted();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) setInUse(true);
      else setError(t("groupCatalog.deleteError"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <CycleModal
      title={t("groupCatalog.deleteTitle")}
      busy={busy}
      onClose={onClose}
    >
      <p className="mb-3 break-words font-semibold text-sky-950">
        {group.name}
      </p>
      {!inUse && (
        <p className="text-slate-500">{t("groupCatalog.deleteDescription")}</p>
      )}
      {inUse && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800"
        >
          {t("groupCatalog.inUse")}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button
          autoFocus
          type="button"
          disabled={busy}
          onClick={onClose}
          className="rounded-xl border px-4 py-2"
        >
          {t("admin.cancel")}
        </button>
        <button
          type="button"
          disabled={busy || inUse}
          onClick={remove}
          className="rounded-xl bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t(busy ? "groupCatalog.deleting" : "groupCatalog.delete")}
        </button>
      </div>
    </CycleModal>
  );
}

export function ReusableGroups() {
  const [groups, setGroups] = useState<CatalogGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState("");
  const [success, setSuccess] = useState(false);
  const [editing, setEditing] = useState<CatalogGroup | null | undefined>(
    undefined,
  );
  const [deleting, setDeleting] = useState<CatalogGroup | null>(null);
  useEffect(() => {
    let cancelled = false;
    cycleApi
      .reusableGroups()
      .then((data) => {
        if (!cancelled) {
          setGroups(data);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [version]);
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es");
  const filtered = groups.filter((group) =>
    normalize(group.name).includes(normalize(search.trim())),
  );
  function actions(group: CatalogGroup) {
    return (
      <div className="flex shrink-0 items-center justify-end gap-1">
        <button
          type="button"
          title={t("cycleDetail.editGroup")}
          aria-label={t("cycleDetail.editGroup")}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          onClick={() => {
            setSuccess(false);
            setEditing(group);
          }}
        >
          <Pencil size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          title={t("groupCatalog.deleteTooltip")}
          aria-label={t("groupCatalog.deleteTooltip")}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          onClick={() => {
            setSuccess(false);
            setDeleting(group);
          }}
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>
    );
  }
  const usage = (group: CatalogGroup) =>
    t(
      group._count.cycles === 1
        ? "groupCatalog.oneCycle"
        : "groupCatalog.cycles",
      { count: group._count.cycles },
    );
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-sky-950">
          {t("cycles.groups")}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {t("cycleDetail.reusableDescription")}
        </p>
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("groupCatalog.search")}
            aria-label={t("groupCatalog.search")}
            className="field pl-10"
          />
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setSuccess(false);
            setEditing(null);
          }}
        >
          {t("groupCatalog.add")}
        </button>
      </div>
      {success && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {t("groupCatalog.deleted")}
        </p>
      )}
      {loading ? (
        <p role="status">{t("groupCatalog.loading")}</p>
      ) : error ? (
        <div role="alert">
          <p>{t("groupCatalog.loadError")}</p>
          <button
            type="button"
            className="primary-button mt-3"
            onClick={() => {
              setLoading(true);
              setVersion((v) => v + 1);
            }}
          >
            {t("dashboard.retry")}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p role="status" className="py-10 text-center text-sm text-slate-500">
          {t(
            groups.length
              ? "groupCatalog.noResults"
              : "cycleDetail.noReusableGroups",
          )}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((group) => (
            <li
              key={group.id}
              className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="shrink-0 rounded-xl bg-cyan-50 p-2.5 text-cyan-700">
                    <Users size={22} aria-hidden="true" />
                  </div>
                  <h3 className="min-w-0 break-words text-lg font-semibold text-sky-950">
                    {group.name}
                  </h3>
                </div>
                {actions(group)}
              </div>
              <dl className="mb-5 mt-6">
                <dt className="text-sm text-slate-500">
                  {t("groupCatalog.usedIn")}
                </dt>
                <dd className="mt-1 font-semibold text-slate-800">
                  {usage(group)}
                </dd>
              </dl>
              <div className="mt-auto border-t border-slate-100 pt-4">
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {t("groupCatalog.active")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing !== undefined && (
        <GroupForm
          group={editing ?? undefined}
          onClose={() => setEditing(undefined)}
          onCreated={() => {
            setEditing(undefined);
            setLoading(true);
            setVersion((v) => v + 1);
          }}
        />
      )}
      {deleting && (
        <DeleteGroupModal
          group={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setGroups((current) =>
              current.filter((group) => group.id !== deleting.id),
            );
            setDeleting(null);
            setSuccess(true);
          }}
        />
      )}
    </section>
  );
}
