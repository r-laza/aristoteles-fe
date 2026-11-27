import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { CycleForm } from "../features/cycles/CycleForm";
import {
  cycleApi,
  getCycle,
  type AcademicCycle,
  type CycleGroup,
} from "../features/cycles/cycles";
import { t } from "../lib/i18n";

export function CycleFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<{
    cycle: AcademicCycle;
    groups: CycleGroup[];
  } | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([getCycle(id), cycleApi.groups(id)])
      .then(([cycle, groups]) => {
        if (!cancelled) setData({ cycle, groups });
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, version]);

  const cancelPath = id ? `/admin/cycles/${id}` : "/admin/cycles";
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-6xl py-5">
        <Link to={cancelPath} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-sky-700">
          <ArrowLeft size={17} aria-hidden="true" />
          {t("cycleDetail.back")}
        </Link>
        <header className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight text-sky-950 sm:text-3xl">
            {t(id ? "cycles.edit" : "cycles.create")}
          </h1>
          <p className="mt-2 text-slate-500">{t("cycles.formDescription")}</p>
        </header>
        {loading ? (
          <p role="status">{t("cycles.loading")}</p>
        ) : loadError || (id && !data) ? (
          <div role="alert" className="rounded-2xl border border-red-100 bg-white p-6 text-red-700">
            <p>{t("cycleDetail.loadError")}</p>
            <button type="button" className="primary-button mt-4" onClick={() => {
              setLoading(true);
              setLoadError(false);
              setVersion((value) => value + 1);
            }}>
              {t("dashboard.retry")}
            </button>
          </div>
        ) : (
          <CycleForm
            cycle={data?.cycle}
            initialGroups={data?.groups}
            onCancel={() => navigate(cancelPath)}
            onCreated={(cycle) => navigate(`/admin/cycles/${cycle.id}`, {
              state: { cycle, created: !id },
            })}
          />
        )}
      </div>
    </AppLayout>
  );
}
