import { CycleForm } from "../features/cycles/CycleForm";
import { EnrollmentForm } from "../features/cycles/EnrollmentForm";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
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

function AddCycleGroupForm({
  cycleId,
  assignedGroups,
  onClose,
  onCreated,
}: {
  cycleId: string;
  assignedGroups: CycleGroup[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groups, setGroups] = useState<ReusableGroup[]>([]);
  const [pensions, setPensions] = useState<Pension[]>([]);
  const assignedIds = new Set(
    assignedGroups.map((group) => group.reusableGroupId),
  );
  const availableGroups = groups.filter((group) => !assignedIds.has(group.id));
  useEffect(() => {
    let cancelled = false;
    Promise.all([cycleApi.reusableGroups(), cycleApi.reusablePensions()])
      .then(([groups, pensions]) => {
        if (!cancelled) {
          setGroups(groups);
          setPensions(pensions);
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
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const groupId = Number(data.get("groupId"));
    const pensionId = Number(data.get("pensionId"));
    if (
      !availableGroups.some((group) => group.id === groupId) ||
      !pensions.some((pension) => pension.id === pensionId)
    ) {
      setError(t("cycleDetail.groupPensionRequired"));
      return;
    }
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await cycleApi.addCycleGroup(cycleId, groupId, pensionId);
      onCreated();
    } catch (cause) {
      setError(
        t(
          cause instanceof ApiError && cause.status === 409
            ? "cycleDetail.groupDuplicate"
            : "cycleDetail.saveError",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <CycleModal title={t("cycleDetail.addGroup")} busy={busy} onClose={onClose}>
      {loading ? (
        <p role="status">{t("cycles.loadingCatalogs")}</p>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <fieldset disabled={busy} className="space-y-4">
            <div>
              <label htmlFor="cycle-group" className="field-label">
                {t("cycleDetail.groupClassroom")}
              </label>
              <select
                id="cycle-group"
                name="groupId"
                autoFocus
                required
                defaultValue=""
                className="field"
              >
                <option value="" disabled>
                  {t("cycleDetail.selectGroupClassroom")}
                </option>
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              {availableGroups.length === 0 && (
                <p className="mt-2 text-sm text-slate-500">
                  {t("cycleDetail.noAvailableGroups")}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="cycle-pension" className="field-label">
                {t("pensionCatalog.pension")}
              </label>
              <select
                id="cycle-pension"
                name="pensionId"
                required
                defaultValue=""
                className="field"
              >
                <option value="" disabled>
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
              {pensions.length === 0 && (
                <p className="mt-2 text-sm text-slate-500">
                  {t("cycleDetail.noAvailablePensions")}
                </p>
              )}
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
                busy || availableGroups.length === 0 || pensions.length === 0
              }
              className="primary-button"
            >
              {t(busy ? "admin.saving" : "cycleDetail.addGroup")}
            </button>
          </div>
        </form>
      )}
    </CycleModal>
  );
}

export function AcademicCycleDetailPage() {
  const { id = "" } = useParams();
  const [data, setData] = useState<{
    cycle: AcademicCycle;
    groups: CycleGroup[];
    enrollments: CycleEnrollment[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const studentsSection = useRef<HTMLElement>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<
    "cycle" | "addGroup" | "enrollment" | null
  >(null);
  const [deletingGroup, setDeletingGroup] = useState<number | null>(null);
  const [groupFilter, setGroupFilter] = useState("");
  const filteredEnrollments =
    data?.enrollments.filter(
      (enrollment) =>
        (!groupFilter || enrollment.group.id === Number(groupFilter)) &&
        normalize(
          `${enrollment.student.fullName} ${enrollment.student.username}`,
        ).includes(normalize(search.trim())),
    ) ?? [];
  const pageSize = 20;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredEnrollments.length / pageSize),
  );
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const visibleEnrollments = filteredEnrollments.slice(
    pageStart,
    pageStart + pageSize,
  );
  const [success, setSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const [today, setToday] = useState(todayKey);
  useEffect(() => {
    const timer = window.setInterval(() => setToday(todayKey()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    let cancelled = false;
    Promise.all([getCycle(id), cycleApi.groups(id), cycleApi.enrollments(id)])
      .then(([cycle, groups, enrollments]) => {
        if (!cancelled) {
          setData({ cycle, groups, enrollments });
          setGroupFilter((current) =>
            groups.some((group) => String(group.id) === current) ? current : "",
          );
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
  }, [id, version]);
  function refresh(message: string) {
    setModal(null);
    setPage(1);
    setSuccess(t(message));
    setActionError("");
    setLoading(true);
    setVersion((value) => value + 1);
  }
  async function deleteGroup(group: CycleGroup) {
    if (
      group._count.enrollments ||
      !window.confirm(t("cycleDetail.confirmDeleteGroup", { name: group.name }))
    )
      return;
    setDeletingGroup(group.id);
    setSuccess("");
    setActionError("");
    try {
      await cycleApi.deleteCycleGroup(id, group.id);
      setGroupFilter((value) => (value === String(group.id) ? "" : value));
      refresh("cycleDetail.groupDeleted");
    } catch (cause) {
      setActionError(
        t(
          cause instanceof ApiError && cause.status === 409
            ? "cycleDetail.groupInUse"
            : "cycleDetail.groupDeleteError",
        ),
      );
    } finally {
      setDeletingGroup(null);
    }
  }
  const labels = [
    "admin.name",
    "cycleDetail.group",
    "cycleDetail.fee",
    "cycleDetail.assignedAmount",
    "cycleDetail.discount",
    "cycleDetail.total",
    "admin.status",
  ];
  return (
    <AppLayout
      banner={{
        src: "/images/banner-aristoteles.png",
        alt: t("dashboard.bannerAlt"),
      }}
    >
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
                <button
                  className="primary-button sm:ml-auto"
                  onClick={() => setModal("cycle")}
                >
                  {t("cycles.edit")}
                </button>
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
              aria-labelledby="cycle-groups-title"
              className="mb-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <h2
                  id="cycle-groups-title"
                  className="text-xl font-semibold text-sky-950"
                >
                  {t("cycleDetail.groupsClassrooms")}
                </h2>
                <button
                  className="primary-button"
                  onClick={() => {
                    setSuccess("");
                    setModal("addGroup");
                  }}
                >
                  <Plus size={18} aria-hidden="true" />
                  {t("cycleDetail.addGroup")}
                </button>
              </div>
              {data.groups.length === 0 ? (
                <p className="py-6 text-center text-slate-500">
                  {t("cycleDetail.noGroups")}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGroupFilter("");
                      setPage(1);
                    }}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium ${!groupFilter ? "border-cyan-600 bg-cyan-50 text-cyan-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                  >
                    {t("cycleDetail.allGroups")}
                  </button>
                  {data.groups.map((group) => (
                    <div
                      key={group.id}
                      className={`flex min-w-64 flex-1 items-start rounded-xl border sm:max-w-sm ${groupFilter === String(group.id) ? "border-cyan-600 bg-cyan-50" : "border-slate-200 bg-white"}`}
                    >
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3 text-left text-sm text-sky-950"
                        onClick={() => {
                          setGroupFilter(String(group.id));
                          setSearch("");
                          setPage(1);
                          studentsSection.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }}
                      >
                        <Users
                          size={17}
                          className="shrink-0 text-cyan-600"
                          aria-hidden="true"
                        />
                        <span className="min-w-0 space-y-1">
                          <strong className="block break-words">
                            {group.name}
                          </strong>
                          <span className="block text-xs text-slate-500">
                            {t(
                              group._count.enrollments === 1
                                ? "cycleDetail.oneStudent"
                                : "cycleDetail.studentCount",
                              { count: group._count.enrollments },
                            )}
                          </span>
                          <span className="block text-xs">
                            <span className="text-slate-500">
                              {t("pensionCatalog.pension")}:{" "}
                            </span>
                            {group.pension
                              ? t("pensionCatalog.monthlyLabel", {
                                  name: group.pension.name,
                                  amount: amount(group.pension.amount),
                                })
                              : t("pensionCatalog.unassigned")}
                          </span>
                          {group.pension && (
                            <span className="block text-xs">
                              <span className="text-slate-500">
                                {t("pensionCatalog.dueDay")}:{" "}
                              </span>
                              {group.pension.dueDay}
                            </span>
                          )}
                        </span>
                      </button>
                      <button
                        type="button"
                        disabled={
                          Boolean(group._count.enrollments) ||
                          deletingGroup === group.id
                        }
                        onClick={() => void deleteGroup(group)}
                        aria-label={t("cycleDetail.deleteGroupNamed", {
                          name: group.name,
                        })}
                        title={
                          group._count.enrollments
                            ? t("cycleDetail.groupInUse")
                            : t("cycleDetail.deleteGroup")
                        }
                        className="mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300"
                      >
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {data.groups.some((group) => group._count.enrollments > 0) && (
                <p className="mt-3 text-sm text-slate-500">
                  {t("cycleDetail.groupInUse")}
                </p>
              )}
            </section>
            <section
              ref={studentsSection}
              tabIndex={-1}
              aria-labelledby="cycle-students-title"
              className="scroll-mt-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6"
            >
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h2
                  id="cycle-students-title"
                  className="text-xl font-semibold text-sky-950"
                >
                  {t("cycleDetail.studentsEnrollments")}
                </h2>
                <button
                  disabled={data.groups.length === 0}
                  className="primary-button"
                  onClick={() => {
                    setSuccess("");
                    setModal("enrollment");
                  }}
                >
                  <Plus size={18} aria-hidden="true" />
                  {t("cycleDetail.enroll")}
                </button>
              </div>
              <div className="mb-4 grid items-end gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cycle-student-search" className="field-label">
                    {t("cycleDetail.searchStudents")}
                  </label>
                  <div className="relative">
                    <Search
                      size={18}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="cycle-student-search"
                      type="search"
                      className="field pl-10"
                      placeholder={t("cycleDetail.searchStudentsPlaceholder")}
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="student-group-filter" className="field-label">
                    {t("cycleDetail.group")}
                  </label>
                  <select
                    id="student-group-filter"
                    value={groupFilter}
                    onChange={(event) => {
                      setGroupFilter(event.target.value);
                      setPage(1);
                    }}
                    className="field"
                  >
                    <option value="">{t("cycleDetail.allGroups")}</option>
                    {data.groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {data.groups.length === 0 && (
                <p className="mb-4 rounded-xl bg-sky-50 p-3 text-sm text-sky-800">
                  {t("cycleDetail.needGroup")}
                </p>
              )}
              {filteredEnrollments.length === 0 ? (
                <p className="py-6 text-center text-slate-500">
                  {t(
                    data.enrollments.length
                      ? "cycleDetail.noMatchingStudents"
                      : "cycleDetail.noEnrollments",
                  )}
                </p>
              ) : (
                <>
                  <div className="hidden xl:block">
                    <table className="w-full table-fixed text-left text-sm">
                      <thead>
                        <tr>
                          {labels.map((label) => (
                            <th
                              key={label}
                              scope="col"
                              className="border-b px-2 py-3 font-medium text-slate-500"
                            >
                              {t(label)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {visibleEnrollments.map((enrollment) => (
                          <tr
                            key={enrollment.id}
                            className="border-b border-slate-100 last:border-0"
                          >
                            {[
                              enrollment.student.fullName,
                              enrollment.group.name,
                              enrollment.fee.name,
                              amount(enrollment.baseAmount),
                              amount(enrollment.discountAmount),
                              amount(enrollment.finalAmount),
                              t("cycleDetail.ACTIVE"),
                            ].map((value, i) => (
                              <td
                                key={labels[i]}
                                className="break-words px-2 py-4"
                              >
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ul className="space-y-4 xl:hidden">
                    {visibleEnrollments.map((enrollment) => (
                      <li
                        key={enrollment.id}
                        className="rounded-xl border border-slate-100 p-4"
                      >
                        <h2 className="break-words font-semibold text-sky-950">
                          {enrollment.student.fullName}
                        </h2>
                        <dl className="mt-3 space-y-2">
                          {[
                            enrollment.group.name,
                            enrollment.fee.name,
                            amount(enrollment.baseAmount),
                            amount(enrollment.discountAmount),
                            amount(enrollment.finalAmount),
                            t("cycleDetail.ACTIVE"),
                          ].map((value, i) => (
                            <div
                              key={labels[i + 1]}
                              className="flex justify-between gap-4 text-sm"
                            >
                              <dt className="text-slate-500">
                                {t(labels[i + 1])}
                              </dt>
                              <dd className="min-w-0 break-words text-right">
                                {value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                <p role="status" className="text-sm text-slate-500">
                  {t("cycleDetail.studentRange", {
                    from: filteredEnrollments.length ? pageStart + 1 : 0,
                    to: Math.min(
                      pageStart + pageSize,
                      filteredEnrollments.length,
                    ),
                    total: filteredEnrollments.length,
                  })}
                </p>
                <nav
                  aria-label={t("cycleDetail.pagination")}
                  className="flex items-center gap-3"
                >
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                    {t("cycleDetail.previousPage")}
                  </button>
                  <span className="text-sm text-slate-500">
                    {t("cycleDetail.pageOf", {
                      page: currentPage,
                      total: totalPages,
                    })}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage(currentPage + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t("cycleDetail.nextPage")}
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </section>
            {modal === "cycle" && (
              <CycleForm
                cycle={data.cycle}
                initialGroups={data.groups}
                detailsOnly
                onClose={() => setModal(null)}
                onCreated={() => refresh("cycles.updated")}
              />
            )}
            {modal === "addGroup" && (
              <AddCycleGroupForm
                cycleId={id}
                assignedGroups={data.groups}
                onClose={() => setModal(null)}
                onCreated={() => refresh("cycleDetail.groupAdded")}
              />
            )}
            {modal === "enrollment" && (
              <EnrollmentForm
                id={id}
                groups={data.groups}
                onClose={() => setModal(null)}
                onCreated={() => refresh("cycleDetail.enrolled")}
              />
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
