import { useEffect, useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";
import { t } from "../../lib/i18n";
import { ApiError } from "../../services/api";
import { CycleModal } from "./CycleModal";
import { PensionForm } from "./PensionForm";
import { cycleApi, type CatalogPension } from "./cycles";

function DeletePensionModal({
  pension,
  onClose,
  onDeleted,
}: {
  pension: CatalogPension;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [inUse, setInUse] = useState(pension._count.cycleGroups > 0);
  const [error, setError] = useState("");
  async function remove() {
    if (busy || inUse) return;
    setBusy(true);
    setError("");
    try {
      await cycleApi.deletePension(pension.id);
      onDeleted();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) setInUse(true);
      else setError(t("pensionCatalog.deleteError"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <CycleModal
      title={t("pensionCatalog.deleteTitle")}
      busy={busy}
      onClose={onClose}
    >
      <p className="mb-3 break-words font-semibold text-sky-950">
        {pension.name}
      </p>
      <p className="text-slate-500">{t("pensionCatalog.deleteDescription")}</p>
      {inUse && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800"
        >
          {t("pensionCatalog.inUse")}
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
          {t(busy ? "pensionCatalog.deleting" : "pensionCatalog.delete")}
        </button>
      </div>
    </CycleModal>
  );
}

export function ReusablePensions() {
  const [pensions, setPensions] = useState<CatalogPension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState("");
  const [success, setSuccess] = useState(false);
  const [editing, setEditing] = useState<CatalogPension | null | undefined>(
    undefined,
  );
  const [deleting, setDeleting] = useState<CatalogPension | null>(null);
  useEffect(() => {
    let cancelled = false;
    cycleApi
      .reusablePensions()
      .then((data) => {
        if (!cancelled) {
          setPensions(data);
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
  const filtered = pensions.filter((pension) =>
    normalize(pension.name).includes(normalize(search.trim())),
  );
  function actions(pension: CatalogPension) {
    return (
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          title={t("cycles.editPension")}
          aria-label={t("cycles.editPension")}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          onClick={() => {
            setSuccess(false);
            setEditing(pension);
          }}
        >
          <Pencil size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          title={t("pensionCatalog.deleteTooltip")}
          aria-label={t("pensionCatalog.deleteTooltip")}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          onClick={() => {
            setSuccess(false);
            setDeleting(pension);
          }}
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>
    );
  }
  const amount = (pension: CatalogPension) =>
    t("cycles.amount", {
      amount: Number(pension.amount).toLocaleString("es-EC", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    });
  const usage = (pension: CatalogPension) =>
    t(
      pension._count.cycleGroups === 1
        ? "pensionCatalog.oneGroup"
        : "pensionCatalog.groups",
      { count: pension._count.cycleGroups },
    );
  function status(pension: CatalogPension) {
    const active = pension.isActive;
    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
      >
        {t(active ? "pensionCatalog.active" : "pensionCatalog.inactive")}
      </span>
    );
  }
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-sky-950">
          {t("cycles.pensions")}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {t("cycles.reusablePensionsDescription")}
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
            placeholder={t("pensionCatalog.search")}
            aria-label={t("pensionCatalog.search")}
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
          {t("pensionCatalog.add")}
        </button>
      </div>
      {success && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {t("pensionCatalog.deleted")}
        </p>
      )}
      {loading ? (
        <p role="status">{t("cycles.loadingCatalogs")}</p>
      ) : error ? (
        <div role="alert">
          <p>{t("cycles.catalogError")}</p>
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
            pensions.length
              ? "pensionCatalog.noResults"
              : "cycles.noReusablePensions",
          )}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {[
                  "admin.name",
                  "pensionCatalog.monthlyAmount",
                  "pensionCatalog.dueDay",
                  "feeCatalog.usedIn",
                  "admin.status",
                  "pensionCatalog.actions",
                ].map((key, index) => (
                  <th
                    key={key}
                    scope="col"
                    className={`px-5 py-3 font-medium ${index === 5 ? "text-right" : ""}`}
                  >
                    {t(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((pension) => (
                <tr
                  key={pension.id}
                  className="transition hover:bg-slate-50/50"
                >
                  <th
                    scope="row"
                    className="max-w-xs break-words px-5 py-4 font-semibold text-sky-950"
                  >
                    {pension.name}
                  </th>
                  <td className="whitespace-nowrap px-5 py-4 font-medium tabular-nums text-slate-800">
                    {amount(pension)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                    {pension.dueDay}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                    {usage(pension)}
                  </td>
                  <td className="px-5 py-4">{status(pension)}</td>
                  <td className="px-5 py-4">{actions(pension)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing !== undefined && (
        <PensionForm
          pension={editing ?? undefined}
          onClose={() => setEditing(undefined)}
          onCreated={() => {
            setEditing(undefined);
            setLoading(true);
            setVersion((v) => v + 1);
          }}
        />
      )}
      {deleting && (
        <DeletePensionModal
          pension={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setPensions((current) =>
              current.filter((pension) => pension.id !== deleting.id),
            );
            setDeleting(null);
            setSuccess(true);
          }}
        />
      )}
    </section>
  );
}
