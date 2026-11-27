import { useEffect, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useLocation, useSearchParams } from "react-router-dom";
import type { Person } from "../auth/types";
import { AppLayout } from "../components/layout/AppLayout";
import {
  cycleApi,
  getCycle,
  readCycles,
  type AcademicCycle,
  type AvailableStudent,
  type CycleEnrollment,
  type CycleGroup,
} from "../features/cycles/cycles";
import {
  assignedBranches,
  filterEnrollmentRows,
  groupsForBranch,
} from "../features/enrollments/enrollmentFilters";
import { t } from "../lib/i18n";
import { Modal as PersonModal, StudentForm } from "./AdminPage";
import { EnrollmentConfirmation } from "./CycleEnrollmentsPage";

const PAGE_SIZE = 20;
type EnrollmentTab = "enroll" | "enrolled";

function currentActiveCycle(cycles: AcademicCycle[]) {
  return cycles
    .filter((cycle) => cycle.status === "ACTIVE")
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
  const [students, setStudents] = useState<AvailableStudent[]>([]);
  const [enrollments, setEnrollments] = useState<CycleEnrollment[]>([]);
  const [tab, setTab] = useState<EnrollmentTab>("enroll");
  const [studentSearch, setStudentSearch] = useState("");
  const [enrollmentSearch, setEnrollmentSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingCycle, setLoadingCycle] = useState(Boolean(cycleId));
  const [loadingGroups, setLoadingGroups] = useState(
    Boolean(cycleId && branchId),
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    (location.state as { enrollmentCreated?: boolean } | null)
      ?.enrollmentCreated
      ? t("enrollmentsModule.enrolledSuccess")
      : "",
  );
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<AvailableStudent | null>(null);

  useEffect(() => {
    let cancelled = false;
    readCycles()
      .then((rows) => {
        if (cancelled) return;
        setCycles(rows);
        if (autoSelectionAttempted.current) return;
        autoSelectionAttempted.current = true;
        const activeCycle = currentActiveCycle(rows);
        const requestedCycle = rows.find(
          (item) => String(item.id) === initialCycleId,
        );
        if (requestedCycle?.status !== "ACTIVE" && activeCycle) {
          setLoadingCycle(true);
          setSearchParams(
            { cycleId: String(activeCycle.id) },
            { replace: true },
          );
        } else if (requestedCycle?.status !== "ACTIVE" && initialCycleId) {
          setLoadingCycle(false);
          setSearchParams({}, { replace: true });
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
      setCycle(null);
      setStudents([]);
      setEnrollments([]);
      return;
    }
    let cancelled = false;
    Promise.all([
      getCycle(cycleId),
      cycleApi.available(cycleId),
      cycleApi.enrollments(cycleId),
    ])
      .then(([selectedCycle, availableStudents, enrollmentRows]) => {
        if (cancelled) return;
        setCycle(selectedCycle);
        setStudents(availableStudents);
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
    if (!cycleId || !branchId) {
      setGroups([]);
      return;
    }
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
  const selectedGroup = branchGroups.find(
    (group) => group.id === Number(groupId),
  );
  const normalizedStudentSearch = studentSearch.trim().toLocaleLowerCase("es");
  const visibleStudents = students.filter((student) =>
    `${student.dni} ${student.fullName}`
      .toLocaleLowerCase("es")
      .includes(normalizedStudentSearch),
  );
  const filteredEnrollments = filterEnrollmentRows(
    enrollments,
    branchId,
    groupId,
    enrollmentSearch,
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredEnrollments.length / PAGE_SIZE),
  );
  const visibleEnrollments = filteredEnrollments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const hasContext = Boolean(
    cycle?.status === "ACTIVE" && branchId && selectedGroup,
  );

  async function enrollmentCompleted() {
    setSelectedStudent(null);
    setError("");
    try {
      const [availableStudents, enrollmentRows] = await Promise.all([
        cycleApi.available(cycleId),
        cycleApi.enrollments(cycleId),
      ]);
      setStudents(availableStudents);
      setEnrollments(enrollmentRows);
      setSuccess(t("enrollmentsModule.enrolledSuccess"));
      setTab("enrolled");
      setPage(1);
    } catch {
      setError(t("enrollmentPage.refreshError"));
    }
  }

  function studentCreated(person: Person) {
    setCreatingStudent(false);
    if (person.kind !== "STUDENT" || !person.dni || !person.isActive) return;
    const created = {
      id: person.id,
      fullName: person.fullName,
      dni: person.dni,
    };
    setStudents((current) => [
      created,
      ...current.filter((student) => student.id !== created.id),
    ]);
    setStudentSearch(created.dni);
    setSuccess(t("enrollmentPage.studentCreated"));
  }

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
          <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-800">
            {success}
          </p>
        )}
        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-red-800">
            {error}
          </p>
        )}

        <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <label htmlFor="enrollments-cycle" className="field-label">{t("enrollmentsModule.cycle")}</label>
              <select id="enrollments-cycle" className="field" value={cycleId} disabled={loading} onChange={(event) => {
                setLoadingCycle(Boolean(event.target.value));
                setCycle(null);
                setGroups([]);
                setStudents([]);
                setEnrollments([]);
                setStudentSearch("");
                setEnrollmentSearch("");
                updateFilters({ cycleId: event.target.value, branchId: "", groupId: "" });
              }}>
                <option value="">{t("enrollmentsModule.selectCycle")}</option>
                {cycles.map((item) => (
                  <option key={item.id} value={item.id} disabled={item.status !== "ACTIVE"}>{item.name} — {t(`cycles.${item.status.toLowerCase()}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="enrollments-branch" className="field-label">{t("branches.branch")}</label>
              <select id="enrollments-branch" className="field" value={branchId} disabled={!cycle || cycle.status !== "ACTIVE" || loadingCycle} onChange={(event) => {
                setGroups([]);
                setLoadingGroups(Boolean(event.target.value));
                updateFilters({ branchId: event.target.value, groupId: "" });
              }}>
                <option value="">{t("branches.select")}</option>
                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="enrollments-group" className="field-label">{t("enrollmentPage.group")}</label>
              <select id="enrollments-group" className="field" value={groupId} disabled={!branchId || loadingGroups || branchGroups.length === 0} onChange={(event) => updateFilters({ groupId: event.target.value })}>
                <option value="">{t("enrollmentPage.selectGroup")}</option>
                {branchGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
            </div>
          </div>
        </section>

        {!loading && !cycles.some((item) => item.status === "ACTIVE") && (
          <p role="status" className="mb-6 rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-sky-900">{t("enrollmentsModule.noActiveCycle")}</p>
        )}
        {branchId && !loadingGroups && branchGroups.length === 0 && (
          <p role="status" className="mb-6 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{t("enrollmentsModule.noBranchGroups")}</p>
        )}

        <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div role="tablist" aria-label={t("enrollmentsModule.tabsLabel")} className="flex overflow-x-auto border-b border-slate-200 px-4 sm:px-6">
            {(["enroll", "enrolled"] as const).map((item) => (
              <button key={item} type="button" role="tab" aria-selected={tab === item} className={`min-h-14 whitespace-nowrap border-b-2 px-4 text-sm font-semibold ${tab === item ? "border-sky-700 text-sky-800" : "border-transparent text-slate-500 hover:text-sky-700"}`} onClick={() => setTab(item)}>
                {t(item === "enroll" ? "enrollmentsModule.enrollTab" : "enrollmentPage.enrolledStudents")}
              </button>
            ))}
          </div>

          {!hasContext ? (
            <p className="px-6 py-12 text-center text-slate-500">{t("enrollmentsModule.selectContext")}</p>
          ) : tab === "enroll" ? (
            <div className="p-4 sm:p-6">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <SearchField id="available-student-search" label={t("enrollmentPage.search")} placeholder={t("enrollmentPage.searchPlaceholder")} value={studentSearch} onChange={setStudentSearch} />
                <button type="button" className="primary-button" onClick={() => setCreatingStudent(true)}><Plus size={18} aria-hidden="true" />{t("enrollmentPage.createStudent")}</button>
              </div>
              {loadingCycle ? <p role="status">{t("cycles.loading")}</p> : visibleStudents.length === 0 ? (
                <p className="py-10 text-center text-slate-500">{t(students.length ? "enrollmentPage.noResults" : "enrollmentPage.noAvailable")}</p>
              ) : (
                <StudentList students={visibleStudents} cycle={cycle!} group={selectedGroup!} onEnroll={setSelectedStudent} />
              )}
            </div>
          ) : (
            <div>
              <div className="border-b border-slate-100 p-4 sm:p-6">
                <SearchField id="enrollment-search" label={t("enrollmentsModule.search")} placeholder={t("enrollmentsModule.searchPlaceholder")} value={enrollmentSearch} onChange={(value) => { setEnrollmentSearch(value); setPage(1); }} />
              </div>
              {visibleEnrollments.length === 0 ? (
                <p className="p-10 text-center text-slate-500">{t("enrollmentsModule.empty")}</p>
              ) : (
                <EnrolledList rows={visibleEnrollments} count={filteredEnrollments.length} page={page} totalPages={totalPages} onPage={setPage} />
              )}
            </div>
          )}
        </section>
      </div>

      {creatingStudent && (
        <PersonModal title={t("admin.createByRole.STUDENT")} onClose={() => setCreatingStudent(false)}><StudentForm onClose={() => setCreatingStudent(false)} onSaved={studentCreated} /></PersonModal>
      )}
      {selectedStudent && cycle && selectedGroup?.pension && (cycle.category === "PREUNIVERSITY" || cycle.fee) && (
        <EnrollmentConfirmation cycle={cycle} group={selectedGroup} student={selectedStudent} onClose={() => setSelectedStudent(null)} onEnrolled={() => void enrollmentCompleted()} />
      )}
    </AppLayout>
  );
}

function SearchField({ id, label, placeholder, value, onChange }: { id: string; label: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return <div className="w-full sm:max-w-md"><label htmlFor={id} className="field-label">{label}</label><div className="relative"><Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id={id} type="search" className="field pl-10" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></div></div>;
}

function StudentList({ students, cycle, group, onEnroll }: { students: AvailableStudent[]; cycle: AcademicCycle; group: CycleGroup; onEnroll: (student: AvailableStudent) => void }) {
  const disabled = !group.pension || (cycle.category === "SCHOOL" && !cycle.fee);
  return <><ul className="grid gap-3 md:hidden">{students.map((student) => <li key={student.id} className="rounded-xl border border-slate-200 p-4"><p className="font-semibold text-sky-950">{student.fullName}</p><p className="mt-1 text-sm text-slate-500">{student.dni}</p><p className="mt-2 text-sm font-medium text-emerald-700">{t("admin.active")}</p><button type="button" className="primary-button mt-4 min-h-12 w-full justify-center" disabled={disabled} onClick={() => onEnroll(student)}>{t("enrollmentPage.enroll")}</button></li>)}</ul><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-5 py-3">{t("enrollmentPage.dni")}</th><th className="px-5 py-3">{t("enrollmentPage.student")}</th><th className="px-5 py-3">{t("admin.status")}</th><th className="px-5 py-3 text-right">{t("admin.actions")}</th></tr></thead><tbody className="divide-y divide-slate-100">{students.map((student) => <tr key={student.id}><td className="px-5 py-4">{student.dni}</td><td className="px-5 py-4 font-semibold text-sky-950">{student.fullName}</td><td className="px-5 py-4 text-emerald-700">{t("admin.active")}</td><td className="px-5 py-4 text-right"><button type="button" className="primary-button ml-auto" disabled={disabled} onClick={() => onEnroll(student)}>{t("enrollmentPage.enroll")}</button></td></tr>)}</tbody></table></div></>;
}

function EnrolledList({ rows, count, page, totalPages, onPage }: { rows: CycleEnrollment[]; count: number; page: number; totalPages: number; onPage: (page: number) => void }) {
  return <><ul className="grid gap-3 p-4 md:hidden">{rows.map((row) => <li key={row.id} className="rounded-xl border border-slate-200 p-4"><p className="font-semibold text-sky-950">{row.student.fullName}</p><p className="mt-1 text-sm text-slate-500">{row.student.dni}</p><p className="mt-3 text-sm">{row.group.name}</p><p className="mt-1 text-sm text-slate-500">{enrollmentDate(row.createdAt)}</p></li>)}</ul><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-5 py-3">{t("enrollmentPage.student")}</th><th className="px-5 py-3">{t("enrollmentPage.dni")}</th><th className="px-5 py-3">{t("enrollmentPage.group")}</th><th className="px-5 py-3">{t("enrollmentsModule.date")}</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.id}><td className="px-5 py-4 font-semibold text-sky-950">{row.student.fullName}</td><td className="px-5 py-4">{row.student.dni}</td><td className="px-5 py-4">{row.group.name}</td><td className="px-5 py-4">{enrollmentDate(row.createdAt)}</td></tr>)}</tbody></table></div><div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="text-sm text-slate-500">{t("enrollmentsModule.resultCount", { count })}</p><div className="flex items-center gap-3"><button type="button" className="secondary-button" disabled={page === 1} onClick={() => onPage(page - 1)}>{t("enrollmentsModule.previous")}</button><span className="text-sm text-slate-500">{t("enrollmentsModule.pageOf", { page, total: totalPages })}</span><button type="button" className="secondary-button" disabled={page === totalPages} onClick={() => onPage(page + 1)}>{t("enrollmentsModule.next")}</button></div></div></>;
}
