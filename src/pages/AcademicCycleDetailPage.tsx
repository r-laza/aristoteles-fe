import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { t } from "../lib/i18n";
import { ApiError } from "../services/api";
import { CycleModal } from "../features/cycles/CycleModal";
import {
  cycleApi,
  getCycle,
  cycleStatus,
  todayKey,
  formatCycleDate,
  type AcademicCycle,
  type CycleGroup,
  type CycleEnrollment,
  type ReusableGroup,
  type Pension,
  type Branch,
} from "../features/cycles/cycles";

const amount = (value: number | string) =>
  t("cycles.amount", {
    amount: Number(value).toLocaleString("es-EC", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  });
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");

function ConfigureBranchesForm({
  cycleId,
  cycleBranches,
  assignedGroups,
  initialBranchId,
  onClose,
  onSaved,
}: {
  cycleId: string;
  cycleBranches: Branch[];
  assignedGroups: CycleGroup[];
  initialBranchId?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [groups, setGroups] = useState<ReusableGroup[]>([]);
  const [pensions, setPensions] = useState<Pension[]>([]);
  const [branchId, setBranchId] = useState(initialBranchId ?? 0);
  const [selection, setSelection] = useState<Record<number, number>>({});
  const [search, setSearch] = useState("");
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      cycleApi.branches(),
      cycleApi.reusableGroups(),
      cycleApi.reusablePensions(),
    ])
      .then(([branches, groups, pensions]) => {
        if (!cancelled) {
          const activeBranches = branches.filter(
            (branch) =>
              branch.isActive ||
              cycleBranches.some((row) => row.id === branch.id),
          );
          setBranches(activeBranches);
          setGroups(groups);
          setPensions(pensions);
          setBranchId((current) => current || activeBranches[0]?.id || 0);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled) setError(t("cycles.catalogError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cycleId]);
  useEffect(() => {
    setSelection(
      Object.fromEntries(
        assignedGroups
          .filter((group) => group.branch.id === branchId && group.pensionId)
          .map((group) => [group.reusableGroupId, group.pensionId!]),
      ),
    );
  }, [assignedGroups, branchId]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!branchId || Object.values(selection).some((pensionId) => !pensionId)) {
      setError(t("cycleDetail.groupPensionRequired"));
      return;
    }
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await cycleApi.configureCycleBranch(
        cycleId,
        branchId,
        Object.entries(selection).map(([groupId, pensionId]) => ({
          groupId: Number(groupId),
          pensionId,
        })),
      );
      onSaved();
    } catch (cause) {
      setError(
        t(
          cause instanceof ApiError && cause.status === 409
            ? "cycleDetail.configurationInUse"
            : "cycleDetail.saveError",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  const visibleGroups = groups.filter((group) =>
    normalize(group.name).includes(normalize(search)),
  );
  return (
    <CycleModal
      title={t("cycleDetail.configureBranches")}
      busy={busy}
      onClose={onClose}
    >
      {loading ? (
        <p role="status">{t("cycles.loadingCatalogs")}</p>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <fieldset disabled={busy} className="space-y-4">
            <div>
              <label htmlFor="configure-cycle-branch" className="field-label">
                {t("branches.branch")}
              </label>
              <select
                id="configure-cycle-branch"
                autoFocus
                value={branchId}
                onChange={(event) => setBranchId(Number(event.target.value))}
                className="field"
              >
                <option value={0} disabled>
                  {t("branches.select")}
                </option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                    {cycleBranches.some((row) => row.id === branch.id)
                      ? ` · ${t("cycleDetail.assigned")}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="configure-group-search" className="field-label">
                {t("cycleDetail.searchGroups")}
              </label>
              <input
                id="configure-group-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("cycleDetail.searchGroupsPlaceholder")}
                className="field"
              />
            </div>
            <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
              {visibleGroups.map((group) => {
                const selected = Object.hasOwn(selection, group.id);
                return (
                  <div
                    key={group.id}
                    className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(13rem,1fr)] sm:items-center"
                  >
                    <label className="flex items-center gap-3 font-medium text-sky-950">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) =>
                          setSelection((current) => {
                            const next = { ...current };
                            if (event.target.checked)
                              next[group.id] = pensions[0]?.id ?? 0;
                            else delete next[group.id];
                            return next;
                          })
                        }
                      />
                      {group.name}
                    </label>
                    {selected && (
                      <select
                        aria-label={t("cycleDetail.pensionForGroup", {
                          name: group.name,
                        })}
                        value={selection[group.id]}
                        onChange={(event) =>
                          setSelection((current) => ({
                            ...current,
                            [group.id]: Number(event.target.value),
                          }))
                        }
                        className="field"
                        required
                      >
                        <option value={0} disabled>
                          {t("cycleDetail.selectPension")}
                        </option>
                        {pensions.map((pension) => (
                          <option key={pension.id} value={pension.id}>
                            {t("cycleDetail.pensionOption", {
                              name: pension.name,
                              amount: amount(pension.amount),
                              day: pension.dueDay,
                            })}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-xl border px-4 py-2"
            >
              {t("admin.cancel")}
            </button>
            <button
              disabled={
                busy ||
                !branchId ||
                groups.length === 0 ||
                pensions.length === 0
              }
              className="primary-button"
            >
              {t(busy ? "admin.saving" : "cycleDetail.saveConfiguration")}
            </button>
          </div>
        </form>
      )}
    </CycleModal>
  );
}

export function AcademicCycleDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const [createdCycle] = useState(() => {
    const state = location.state as {
      cycle?: AcademicCycle;
      created?: boolean;
    } | null;
    return state?.cycle?.id === Number(id) ? state.cycle : null;
  });
  const [createdFromNavigation] = useState(() =>
    Boolean(
      (location.state as { created?: boolean } | null)?.created && createdCycle,
    ),
  );
  const [data, setData] = useState<{
    cycle: AcademicCycle;
    groups: CycleGroup[];
    enrollments: CycleEnrollment[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const [modal, setModal] = useState<"cycle" | "configure" | null>(null);
  const [actionBranchId, setActionBranchId] = useState<number | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<number | null>(null);
  const [success, setSuccess] = useState(() =>
    createdFromNavigation ? t("cycles.success") : "",
  );
  const [actionError, setActionError] = useState("");
  const [today, setToday] = useState(todayKey);
  useEffect(() => {
    const timer = window.setInterval(() => setToday(todayKey()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    let cancelled = false;
    const cycleRequest =
      version === 0 && createdCycle
        ? Promise.resolve(createdCycle)
        : getCycle(id);
    Promise.all([cycleRequest, cycleApi.groups(id), cycleApi.enrollments(id)])
      .then(([cycle, groups, enrollments]) => {
        if (!cancelled) {
          setData({ cycle, groups, enrollments });
          setError("");
        }
      })
      .catch((error) => {
        if (!cancelled)
          setError(
            t(
              error instanceof ApiError && error.status === 404
                ? "cycleDetail.notFound"
                : "cycleDetail.loadError",
            ),
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [createdCycle, id, version]);
  function refresh(message: string) {
    setModal(null);
    setSuccess(t(message));
    setActionError("");
    setLoading(true);
    setVersion((value) => value + 1);
  }
  async function deleteBranch(branch: Branch) {
    if (
      !window.confirm(
        t("cycleDetail.confirmRemoveBranch", { name: branch.name }),
      )
    )
      return;
    setDeletingBranch(branch.id);
    setSuccess("");
    setActionError("");
    try {
      await cycleApi.deleteCycleBranch(id, branch.id);
      refresh("cycleDetail.branchRemoved");
    } catch (cause) {
      setActionError(
        t(
          cause instanceof ApiError && cause.status === 409
            ? "cycleDetail.branchInUse"
            : "cycleDetail.branchRemoveError",
        ),
      );
    } finally {
      setDeletingBranch(null);
    }
  }
  return (
    <AppLayout>
      <div className="py-5">
        <Link
          to="/admin/cycles"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-sky-700"
        >
          <ArrowLeft size={17} />
          {t("cycleDetail.back")}
        </Link>
        {loading ? (
          <p role="status">{t("cycles.loading")}</p>
        ) : error || !data ? (
          <div role="alert" className="rounded-2xl bg-white p-6">
            <p>{error || t("cycleDetail.loadError")}</p>
            <button
              className="primary-button mt-4"
              onClick={() => {
                setLoading(true);
                setVersion((value) => value + 1);
              }}
            >
              {t("dashboard.retry")}
            </button>
          </div>
        ) : (
          <>
            {success && (
              <p
                role="status"
                className="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-800"
              >
                {success}
              </p>
            )}
            {actionError && (
              <p
                role="alert"
                className="mb-4 rounded-xl bg-red-50 p-3 text-red-800"
              >
                {actionError}
              </p>
            )}
            <section
              aria-label={t("cycleDetail.summary")}
              className="mb-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="break-words text-2xl font-bold text-sky-950 sm:text-3xl">
                  {data.cycle.name}
                </h1>
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-sky-800">
                  {t(`cycles.${cycleStatus(data.cycle, today)}`)}
                </span>
                <Link
                  to={`/admin/cycles/${id}/edit`}
                  className="primary-button sm:ml-auto"
                >
                  {t("cycles.edit")}
                </Link>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-3 xl:grid-cols-6">
                {[
                  ["cycles.startDate", formatCycleDate(data.cycle.startDate)],
                  ["cycles.endDate", formatCycleDate(data.cycle.endDate)],
                  ["cycles.students", data.cycle.students],
                  ["cycles.groups", data.cycle.groups],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-xs text-slate-500">
                      {t(String(label))}
                    </dt>
                    <dd className="mt-1 break-words font-semibold text-sky-950">
                      {value}
                    </dd>
                  </div>
                ))}
                <div className="col-span-2 sm:col-span-2">
                  <dt className="text-xs text-slate-500">
                    {t("pensionCatalog.generalFee")}
                  </dt>
                  {data.cycle.fee ? (
                    <dd className="mt-1 space-y-1 text-sky-950">
                      <p>
                        <span className="text-xs font-normal text-slate-500">
                          {t("cycleDetail.feeName")}:{" "}
                        </span>
                        <span className="font-semibold">
                          {data.cycle.fee.name}
                        </span>
                      </p>
                      <p>
                        <span className="text-xs font-normal text-slate-500">
                          {t("cycleDetail.feeAmount")}:{" "}
                        </span>
                        <span className="font-semibold">
                          {amount(data.cycle.fee.amount)}
                        </span>
                      </p>
                    </dd>
                  ) : (
                    <dd className="mt-1 font-semibold text-sky-950">
                      {t("admin.unavailable")}
                    </dd>
                  )}
                </div>
              </dl>
            </section>
            <section
              className="mb-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6"
              aria-labelledby="cycle-hierarchy-title"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <h2
                  id="cycle-hierarchy-title"
                  className="text-xl font-semibold text-sky-950"
                >
                  {t("branches.hierarchyTitle")}
                </h2>
                <button
                  className="primary-button"
                  onClick={() => {
                    setActionBranchId(null);
                    setModal("configure");
                  }}
                >
                  <Plus size={18} />
                  {t("cycleDetail.configureBranches")}
                </button>
              </div>
              <div className="space-y-4">
                {data.cycle.branches.map(({ branch }) => {
                  const branchGroups = data.groups.filter(
                    (group) => group.branch.id === branch.id,
                  );
                  return (
                    <article
                      key={branch.id}
                      className="rounded-2xl border border-slate-200 p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-sky-950">
                            {branch.name}
                          </h3>
                          {branch.address && (
                            <p className="text-sm text-slate-500">
                              {branch.address}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/admin/cycles/${id}/enrollments?branchId=${branch.id}`}
                            className="rounded-xl border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-800"
                          >
                            {t("cycleDetail.enroll")}
                          </Link>
                          <button
                            type="button"
                            className="primary-button"
                            onClick={() => {
                              setActionBranchId(branch.id);
                              setModal("configure");
                            }}
                          >
                            {t("cycleDetail.editConfiguration")}
                          </button>
                          <button
                            type="button"
                            disabled={deletingBranch === branch.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                            onClick={() => void deleteBranch(branch)}
                          >
                            <Trash2 size={16} />
                            {t("cycleDetail.removeBranch")}
                          </button>
                        </div>
                      </div>
                      {branchGroups.length ? (
                        <div className="mt-4 grid gap-3 lg:grid-cols-2">
                          {branchGroups.map((group) => {
                            const enrolled = data.enrollments.filter(
                              (enrollment) => enrollment.group.id === group.id,
                            );
                            return (
                              <section
                                key={group.id}
                                className="rounded-xl bg-slate-50 p-4"
                              >
                                <div>
                                  <h4 className="font-semibold text-sky-950">
                                    {group.name}
                                  </h4>
                                  <p className="mt-1 text-sm text-slate-600">
                                    {group.pension
                                      ? t("pensionCatalog.monthlyLabel", {
                                          name: group.pension.name,
                                          amount: amount(group.pension.amount),
                                        })
                                      : t("pensionCatalog.unassigned")}
                                  </p>
                                  {group.pension && (
                                    <p className="text-xs text-slate-500">
                                      {t("pensionCatalog.dueDay")}:{" "}
                                      {group.pension.dueDay}
                                    </p>
                                  )}
                                </div>
                                <div className="mt-3 border-t border-slate-200 pt-3">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {t("cycleDetail.studentCount", {
                                      count: enrolled.length,
                                    })}
                                  </p>
                                  {enrolled.length > 0 && (
                                    <ul className="mt-2 space-y-1 text-sm">
                                      {enrolled.map((enrollment) => (
                                        <li key={enrollment.id}>
                                          {enrollment.student.fullName}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </section>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                          {t("cycleDetail.noGroups")}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
            {modal === "configure" && (
              <ConfigureBranchesForm
                cycleId={id}
                cycleBranches={data.cycle.branches.map(({ branch }) => branch)}
                assignedGroups={data.groups}
                initialBranchId={actionBranchId ?? undefined}
                onClose={() => setModal(null)}
                onSaved={() => refresh("cycleDetail.configurationSaved")}
              />
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
