import { CycleForm } from "../features/cycles/CycleForm";
import { EnrollmentForm } from "../features/cycles/EnrollmentForm";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { t } from "../lib/i18n";
import { ApiError } from "../services/api";
import {
  cycleApi,
  feeAvailable,
  getCycle,
  cycleStatus,
  todayKey,
  formatCycleDate,
  type AcademicCycle,
  type CycleGroup,
  type CycleEnrollment,
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
  const [modal, setModal] = useState<"group" | "enrollment" | null>(null);
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
    setLoading(true);
    setVersion((value) => value + 1);
  }
  const labels = [
    "admin.name",
    "auth.username",
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
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <h1 className="break-words text-3xl font-bold text-sky-950">
                {data.cycle.name}
              </h1>
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-sky-800">
                {t(`cycles.${cycleStatus(data.cycle, today)}`)}
              </span>
              <button
                className="primary-button sm:ml-auto"
                onClick={() => setModal("group")}
              >
                {t("cycles.edit")}
              </button>
            </div>
            {success && (
              <p
                role="status"
                className="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-800"
              >
                {success}
              </p>
            )}
            <section aria-label={t("cycleDetail.summary")} className="mb-6">
              <dl className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  ["cycles.startDate", formatCycleDate(data.cycle.startDate)],
                  ["cycles.endDate", formatCycleDate(data.cycle.endDate)],
                  ["cycles.students", data.cycle.students],
                  ["cycles.groups", data.cycle.groups],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="min-w-0 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                  >
                    <dt className="text-sm text-slate-500">
                      {t(String(label))}
                    </dt>
                    <dd className="mt-2 break-words text-lg font-semibold text-sky-950">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
            <section
              aria-labelledby="cycle-groups-title"
              className="mb-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6"
            >
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h2
                  id="cycle-groups-title"
                  className="text-xl font-semibold text-sky-950"
                >
                  {t("cycleDetail.groups")}
                </h2>
                <button
                  className="primary-button"
                  onClick={() => {
                    setSuccess("");
                    setModal("group");
                  }}
                >
                  {t("cycles.editAssignments")}
                </button>
              </div>
              {data.groups.length === 0 ? (
                <p className="py-6 text-center text-slate-500">
                  {t("cycleDetail.noGroups")}
                </p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {data.groups.map((group) => (
                    <li
                      key={group.id}
                      className="rounded-2xl border border-slate-100 p-5"
                    >
                      <Users size={22} className="mb-3 text-cyan-600" />
                      <h2 className="break-words text-lg font-semibold text-sky-950">
                        {group.name}
                      </h2>
                      <p className="mt-2 text-sm text-slate-500">
                        {t("cycleDetail.groupCount", {
                          count: group._count.enrollments,
                        })}
                      </p>
                      {group.fees.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-500">
                          {t("cycleDetail.noFees")}
                        </p>
                      ) : (
                        <ul className="mt-4 space-y-3">
                          {group.fees.map((fee) => (
                            <li
                              key={fee.id}
                              className="rounded-xl bg-slate-50 p-3"
                            >
                              <div className="flex flex-wrap justify-between gap-2">
                                <span className="break-words font-medium">
                                  {fee.name}
                                </span>
                                <span className="font-semibold">
                                  {amount(fee.amount)}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-slate-500">
                                {t(
                                  fee.validUntil
                                    ? "cycleDetail.feeValidity"
                                    : "cycleDetail.feeValidityOpen",
                                  {
                                    from: formatCycleDate(
                                      fee.validFrom.slice(0, 10),
                                    ),
                                    until: fee.validUntil
                                      ? formatCycleDate(
                                          fee.validUntil.slice(0, 10),
                                        )
                                      : t("cycleDetail.noEndDate"),
                                  },
                                )}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {t(
                                  feeAvailable(fee)
                                    ? "cycleDetail.feeActive"
                                    : "cycleDetail.feeInactive",
                                )}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium text-sky-700">
                        <button onClick={() => setModal("group")}>
                          {t("cycles.editAssignments")}
                        </button>
                        <button
                          onClick={() => {
                            setGroupFilter(String(group.id));
                            setSearch("");
                            setPage(1);
                            studentsSection.current?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                            studentsSection.current?.focus({
                              preventScroll: true,
                            });
                          }}
                        >
                          {t("cycleDetail.viewStudents")}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
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
                  {t("cycles.students")}
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
                              enrollment.student.username,
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
                            enrollment.student.username,
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
            {modal === "group" && (
              <CycleForm
                cycle={data.cycle}
                initialGroups={data.groups}
                onClose={() => setModal(null)}
                onCreated={() => refresh("cycles.updated")}
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
