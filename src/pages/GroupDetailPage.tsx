import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pencil, Trash2, Users } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { GroupForm } from "../features/cycles/GroupForms";
import { DeleteGroupModal } from "../features/cycles/ReusableGroups";
import {
  cycleApi,
  type CatalogGroup,
  type ReusableGroup,
} from "../features/cycles/cycles";
import { t } from "../lib/i18n";

type GroupLocationState = {
  group?: ReusableGroup | CatalogGroup;
  created?: boolean;
};

export function GroupDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const groupId = Number(id);
  const routeState = location.state as GroupLocationState | null;
  const initialGroup = useMemo(
    () =>
      routeState?.group?.id === groupId
        ? {
            ...routeState.group,
            _count:
              "_count" in routeState.group
                ? routeState.group._count
                : { cycles: 0 },
          }
        : null,
    [groupId, routeState],
  );
  const [group, setGroup] = useState<CatalogGroup | null>(initialGroup);
  const [loading, setLoading] = useState(!initialGroup);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (initialGroup) return;
    let cancelled = false;
    cycleApi
      .reusableGroups()
      .then((groups) => {
        if (!cancelled)
          setGroup(groups.find((item) => item.id === groupId) ?? null);
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
  }, [groupId, initialGroup]);

  const usage = group
    ? t(
        group._count.cycles === 1
          ? "groupCatalog.oneCycle"
          : "groupCatalog.cycles",
        { count: group._count.cycles },
      )
    : "";

  return (
    <AppLayout>
      <div className="py-5">
        <Link
          to="/admin/groups"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-sky-700"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          {t("groups.back")}
        </Link>
        {routeState?.created && group && (
          <p
            role="status"
            className="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-800"
          >
            {t("groups.created")}
          </p>
        )}
        {loading ? (
          <p role="status">{t("groupCatalog.loading")}</p>
        ) : error ? (
          <p role="alert" className="rounded-2xl bg-white p-6 text-red-700">
            {t("groupCatalog.loadError")}
          </p>
        ) : !group ? (
          <p role="alert" className="rounded-2xl bg-white p-6 text-slate-600">
            {t("groups.notFound")}
          </p>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
              <div>
                <h1 className="break-words text-3xl font-bold tracking-tight text-sky-950">
                  {group.name}
                </h1>
                <p className="mt-2 text-slate-500">
                  {t("groups.detailSubtitle")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setEditing(true)}
                >
                  <Pencil size={18} aria-hidden="true" />
                  {t("cycleDetail.editGroup")}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 font-medium text-red-700 hover:bg-red-50"
                  onClick={() => setDeleting(true)}
                >
                  <Trash2 size={18} aria-hidden="true" />
                  {t("groupCatalog.delete")}
                </button>
              </div>
            </div>
            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-700">
                  <Users size={22} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">
                    {t("groupCatalog.usedIn")}
                  </p>
                  <p className="font-semibold text-slate-800">{usage}</p>
                </div>
              </div>
              <div className="mt-6 border-t border-slate-100 pt-4">
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {t("groupCatalog.active")}
                </span>
              </div>
            </section>
          </>
        )}
        {editing && group && (
          <GroupForm
            group={group}
            onClose={() => setEditing(false)}
            onCreated={(saved) => {
              setGroup((current) =>
                current ? { ...current, name: saved.name } : current,
              );
              setEditing(false);
            }}
          />
        )}
        {deleting && group && (
          <DeleteGroupModal
            group={group}
            onClose={() => setDeleting(false)}
            onDeleted={() => navigate("/admin/groups", { replace: true })}
          />
        )}
      </div>
    </AppLayout>
  );
}
