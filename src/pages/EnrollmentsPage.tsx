import { useEffect, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import {
  cycleApi,
  getCycle,
  readCycles,
  todayKey,
  type AcademicCycle,
  type CycleEnrollment,
  type CycleGroup,
} from "../features/cycles/cycles";
import { t } from "../lib/i18n";
import {
  assignedBranches,
  filterEnrollmentRows,
  groupsForBranch,
} from "../features/enrollments/enrollmentFilters";
import { ManagePaymentsButton } from "../features/payments/PaymentsTable";

const PAGE_SIZE = 20;

function currentActiveCycle(
  cycles: AcademicCycle[],
  today: string,
): AcademicCycle | undefined {
  return cycles
    .filter(
      (cycle) =>
        cycle.status === "ACTIVE" &&
        cycle.startDate <= today &&
        cycle.endDate >= today,
    )
    .sort(
      (left, right) =>
        right.startDate.localeCompare(left.startDate) || right.id - left.id,
    )[0];
}

const enrollmentDate = (value: string) =>
  new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Guayaquil",
  }).format(new Date(value));

export function EnrollmentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const cycleId = searchParams.get("cycleId") ?? "";
  const branchId = searchParams.get("branchId") ?? "";
  const groupId = searchParams.get("groupId") ?? "";
  const [initialCycleId] = useState(cycleId);
  const autoSelectionAttempted = useRef(false);
  const [cycles, setCycles] = useState<AcademicCycle[]>([]);
  const [cycle, setCycle] = useState<AcademicCycle | null>(null);
  const [groups, setGroups] = useState<CycleGroup[]>([]);
  const [enrollments, setEnrollments] = useState<CycleEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCycle, setLoadingCycle] = useState(Boolean(cycleId));
  const [loadingGroups, setLoadingGroups] = useState(
    Boolean(cycleId && branchId),
  );
  const [error, setError] = useState("");
  const success = (location.state as { enrollmentCreated?: boolean } | null)
    ?.enrollmentCreated
    ? t("enrollmentsModule.enrolledSuccess")
    : "";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    readCycles()
      .then((rows) => {
        if (!cancelled) {
          setCycles(rows);
          if (!initialCycleId && !autoSelectionAttempted.current) {
            autoSelectionAttempted.current = true;
            const activeCycle = currentActiveCycle(rows, todayKey());
            if (activeCycle) {
              setLoadingCycle(true);
              setSearchParams(
                { cycleId: String(activeCycle.id) },
                { replace: true },
              );
            }
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError(t("enrollmentsModule.loadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialCycleId, setSearchParams]);

  useEffect(() => {
    if (!cycleId) {
      return;
    }
    let cancelled = false;
    Promise.all([getCycle(cycleId), cycleApi.enrollments(cycleId)])
      .then(([selectedCycle, enrollmentRows]) => {
        if (cancelled) return;
        setCycle(selectedCycle);
        setEnrollments(enrollmentRows);
        setError("");
      })
      .catch(() => {
        if (!cancelled) setError(t("enrollmentsModule.loadError"));
      })
      .finally(() => {
        if (!cancelled) setLoadingCycle(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cycleId]);

  useEffect(() => {
    if (!cycleId || !branchId) return;
    let cancelled = false;
    cycleApi
      .groupsForBranch(cycleId, branchId)
      .then((rows) => {
        if (!cancelled) {
          setGroups(rows);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled) setError(t("enrollmentsModule.groupsLoadError"));
      })
      .finally(() => {
        if (!cancelled) setLoadingGroups(false);
      });
    return () => {
      cancelled = true;
    };
  }, [branchId, cycleId]);

  function updateFilters(values: {
    cycleId?: string;
    branchId?: string;
    groupId?: string;
  }) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next, { replace: true });
    setPage(1);
  }

  const branches = assignedBranches(cycle);
  const branchGroups = groupsForBranch(groups, branchId);
  const filteredEnrollments = filterEnrollmentRows(
    enrollments,
    branchId,
    groupId,
    search,
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredEnrollments.length / PAGE_SIZE),
  );
  const visibleEnrollments = filteredEnrollments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const paymentPath = (enrollmentId: number) =>
    `/admin/payments/${enrollmentId}/manage?cycleId=${cycleId}&returnTo=enrollments&branchId=${branchId}`;

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-[1600px] py-5">
        <header className="mb-7">
          <h1 className="text-3xl font-bold tracking-tight text-sky-950">
            {t("enrollmentsModule.title")}
          </h1>
          <p className="mt-2 text-slate-500">
            {t("enrollmentsModule.subtitle")}
          </p>
        </header>
        {success && (
          <p
            role="status"
            className="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-800"
          >
            {success}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-red-50 p-3 text-red-800"
          >
            {error}
          </p>
        )}

        <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="enrollments-cycle" className="field-label">
                {t("enrollmentsModule.cycle")}
              </label>
              <select
                id="enrollments-cycle"
                className="field"
                value={cycleId}
                disabled={loading}
                onChange={(event) => {
                  setLoadingCycle(Boolean(event.target.value));
                  setLoadingGroups(false);
                  setCycle(null);
                  setGroups([]);
                  setEnrollments([]);
                  updateFilters({
                    cycleId: event.target.value,
                    branchId: "",
                    groupId: "",
                  });
                }}
              >
                <option value="">{t("enrollmentsModule.selectCycle")}</option>
                {cycles.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="enrollments-branch" className="field-label">
                {t("branches.branch")}
              </label>
              <select
                id="enrollments-branch"
                className="field"
                value={branchId}
                disabled={!cycle || loadingCycle}
                onChange={(event) => {
                  setGroups([]);
                  setLoadingGroups(Boolean(event.target.value));
                  updateFilters({ branchId: event.target.value, groupId: "" });
                }}
              >
                <option value="">{t("branches.select")}</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {branchId && cycle ? (
          <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="grid grid-cols-1 items-end gap-4 border-b border-slate-100 p-4 sm:p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <label htmlFor="enrollment-search" className="field-label">
                  {t("enrollmentsModule.search")}
                </label>
                <div className="relative">
                  <Search
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="enrollment-search"
                    type="search"
                    className="field h-12 pl-10 text-sm"
                    value={search}
                    placeholder={t("enrollmentsModule.searchPlaceholder")}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
              <div className="min-w-0">
                <label htmlFor="enrollments-group" className="field-label">
                  {t("enrollmentPage.group")}
                </label>
                <select
                  id="enrollments-group"
                  className="field h-12 text-sm"
                  value={groupId}
                  disabled={loadingGroups || branchGroups.length === 0}
                  onChange={(event) =>
                    updateFilters({ groupId: event.target.value })
                  }
                >
                  <option value="">{t("enrollmentsModule.allGroups")}</option>
                  {branchGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="primary-button h-12 w-full justify-center whitespace-nowrap lg:w-auto"
                disabled={
                  cycle.status !== "ACTIVE" ||
                  loadingGroups ||
                  branchGroups.length === 0
                }
                onClick={() =>
                  navigate(
                    `/admin/cycles/${cycleId}/enrollments?branchId=${branchId}&returnTo=enrollments`,
                  )
                }
              >
                <Plus size={18} aria-hidden="true" />
                {t("enrollmentsModule.enrollNew")}
              </button>
            </div>
            {cycle.status !== "ACTIVE" && (
              <p className="mx-4 mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 sm:mx-6">
                {t("enrollmentsModule.activeCycleRequired")}
              </p>
            )}
            {!loadingGroups && branchGroups.length === 0 && (
              <p className="mx-4 mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 sm:mx-6">
                {t("enrollmentsModule.noBranchGroups")}
              </p>
            )}
            {loadingCycle || loadingGroups ? (
              <p role="status" className="p-6">
                {t("cycles.loading")}
              </p>
            ) : visibleEnrollments.length === 0 ? (
              <p className="p-10 text-center text-slate-500">
                {t("enrollmentsModule.empty")}
              </p>
            ) : (
              <>
                <ul className="grid gap-3 p-4 md:hidden">
                  {visibleEnrollments.map((enrollment) => (
                    <li
                      key={enrollment.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <p className="font-semibold text-sky-950">
                        {enrollment.student.fullName}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {t("enrollmentPage.dni")}: {enrollment.student.dni}
                      </p>
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="text-slate-500">
                            {t("enrollmentPage.group")}
                          </dt>
                          <dd className="font-medium">
                            {enrollment.group.name}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">
                            {t("enrollmentsModule.date")}
                          </dt>
                          <dd className="font-medium">
                            {enrollmentDate(enrollment.createdAt)}
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-4">
                        <ManagePaymentsButton
                          onClick={() => navigate(paymentPath(enrollment.id))}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-5 py-3">
                          {t("enrollmentPage.student")}
                        </th>
                        <th className="px-5 py-3 text-right">
                          {t("admin.actions")}
                        </th>
                        <th className="px-5 py-3">{t("enrollmentPage.dni")}</th>
                        <th className="px-5 py-3">
                          {t("enrollmentPage.group")}
                        </th>
                        <th className="px-5 py-3">
                          {t("enrollmentsModule.date")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleEnrollments.map((enrollment) => (
                        <tr key={enrollment.id} className="hover:bg-sky-50/50">
                          <td className="px-5 py-4 font-semibold text-sky-950">
                            {enrollment.student.fullName}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end">
                              <ManagePaymentsButton
                                onClick={() =>
                                  navigate(paymentPath(enrollment.id))
                                }
                              />
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {enrollment.student.dni}
                          </td>
                          <td className="px-5 py-4">{enrollment.group.name}</td>
                          <td className="px-5 py-4">
                            {enrollmentDate(enrollment.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-sm text-slate-500">
                    {t("enrollmentsModule.resultCount", {
                      count: filteredEnrollments.length,
                    })}
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={page === 1}
                      onClick={() => setPage((value) => value - 1)}
                    >
                      {t("enrollmentsModule.previous")}
                    </button>
                    <span className="text-sm text-slate-500">
                      {t("enrollmentsModule.pageOf", {
                        page,
                        total: totalPages,
                      })}
                    </span>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={page === totalPages}
                      onClick={() => setPage((value) => value + 1)}
                    >
                      {t("enrollmentsModule.next")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">
            {t("enrollmentsModule.selectHelp")}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
