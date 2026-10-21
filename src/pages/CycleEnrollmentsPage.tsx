import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { CycleModal } from "../features/cycles/CycleModal";
import { calculateDiscount } from "../features/cycles/enrollment";
import {
  cycleApi,
  formatCycleDate,
  getCycle,
  type AcademicCycle,
  type AvailableStudent,
  type CycleEnrollment,
  type CycleGroup,
} from "../features/cycles/cycles";
import { Modal as PersonModal, StudentForm } from "./AdminPage";
import type { Person } from "../auth/types";
import { t } from "../lib/i18n";
import { ApiError } from "../services/api";

const money = (value: number | string) =>
  t("cycles.amount", {
    amount: Number(value).toLocaleString("es-EC", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  });

function EnrollmentConfirmation({
  cycle,
  group,
  student,
  onClose,
  onEnrolled,
}: {
  cycle: AcademicCycle;
  group: CycleGroup;
  student: AvailableStudent;
  onClose: () => void;
  onEnrolled: (enrollment: CycleEnrollment) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [enrollmentPercent, setEnrollmentPercent] = useState("0");
  const [pensionPercent, setPensionPercent] = useState("0");
  const feeDiscount = calculateDiscount(
    Number(cycle.fee?.amount ?? 0),
    enrollmentPercent,
  );
  const pensionDiscount = calculateDiscount(
    Number(group.pension?.amount ?? 0),
    pensionPercent,
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !cycle.fee ||
      !group.pension ||
      !feeDiscount.valid ||
      !pensionDiscount.valid
    ) {
      setError(t("cycleDetail.invalidDiscount"));
      return;
    }
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const enrollment = await cycleApi.enroll(String(cycle.id), {
        studentId: student.id,
        branchId: group.reusableGroup.branchId,
        groupId: group.id,
        discountPercent: enrollmentPercent || "0",
        pensionDiscountPercent: pensionPercent || "0",
        discountReason: String(data.get("discountReason") ?? "").trim(),
      });
      onEnrolled(enrollment);
    } catch (cause) {
      setError(
        t(
          cause instanceof ApiError && cause.status === 409
            ? "cycleDetail.duplicate"
            : "cycleDetail.saveError",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <CycleModal
      title={t("enrollmentPage.confirmTitle")}
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <dl className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          {[
            ["enrollmentPage.student", student.fullName],
            ["enrollmentPage.cycle", cycle.name],
            ["enrollmentPage.group", group.name],
            ["enrollmentPage.enrollmentFee", money(cycle.fee?.amount ?? 0)],
            [
              "enrollmentPage.monthlyPension",
              money(group.pension?.amount ?? 0),
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-slate-500">{t(label)}</dt>
              <dd className="font-semibold text-sky-950">{value}</dd>
            </div>
          ))}
        </dl>
        <fieldset disabled={busy} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="enrollment-discount" className="field-label">
                {t("enrollmentPage.enrollmentDiscount")}
              </label>
              <input
                id="enrollment-discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={enrollmentPercent}
                onChange={(event) => setEnrollmentPercent(event.target.value)}
                className="field"
              />
              <div
                className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50/70 p-4"
                aria-live="polite"
              >
                <p className="text-sm font-medium text-sky-700">
                  {t("enrollmentPage.finalEnrollment")}
                </p>
                <p
                  className={`mt-1 text-2xl font-bold tabular-nums ${feeDiscount.valid ? "text-sky-950" : "text-red-700"}`}
                >
                  {feeDiscount.valid
                    ? money(feeDiscount.finalCents / 100)
                    : t("cycleDetail.invalidDiscount")}
                </p>
              </div>
            </div>
            <div>
              <label htmlFor="pension-discount" className="field-label">
                {t("enrollmentPage.pensionDiscount")}
              </label>
              <input
                id="pension-discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={pensionPercent}
                onChange={(event) => setPensionPercent(event.target.value)}
                className="field"
              />
              <div
                className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50/70 p-4"
                aria-live="polite"
              >
                <p className="text-sm font-medium text-sky-700">
                  {t("enrollmentPage.finalPension")}
                </p>
                <p
                  className={`mt-1 text-2xl font-bold tabular-nums ${pensionDiscount.valid ? "text-sky-950" : "text-red-700"}`}
                >
                  {pensionDiscount.valid
                    ? money(pensionDiscount.finalCents / 100)
                    : t("cycleDetail.invalidDiscount")}
                </p>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="discount-reason" className="field-label">
              {t("cycleDetail.discountReason")}
            </label>
            <input
              id="discount-reason"
              name="discountReason"
              maxLength={500}
              className="field"
            />
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
            disabled={busy || !feeDiscount.valid || !pensionDiscount.valid}
            className="primary-button"
          >
            {t(busy ? "admin.saving" : "enrollmentPage.confirm")}
          </button>
        </div>
      </form>
    </CycleModal>
  );
}

function TransferModal({ enrollment, cycle, groups, onClose, onSaved }: { enrollment: CycleEnrollment; cycle: AcademicCycle; groups: CycleGroup[]; onClose: () => void; onSaved: () => void }) {
  const [branchId, setBranchId] = useState(""), [groupId, setGroupId] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); const data = new FormData(event.currentTarget); try { await cycleApi.transfer(enrollment.id, { branchId: Number(branchId), groupId: Number(groupId), transferDate: String(data.get("transferDate")), reason: String(data.get("reason")).trim() }); onSaved(); } catch { setError(t("branches.transferError")); } finally { setBusy(false); } }
  return <CycleModal title={t("branches.change")} busy={busy} onClose={onClose}><form onSubmit={(event) => void submit(event)} className="space-y-4"><p className="text-sm text-slate-600">{t("branches.currentLocation", { branch: enrollment.branch.name, group: enrollment.group.name })}</p><div><label className="field-label">{t("branches.newBranch")}</label><select required className="field" value={branchId} onChange={(event) => { setBranchId(event.target.value); setGroupId(""); }}><option value="">{t("branches.select")}</option>{cycle.branches.map(({branch}) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></div><div><label className="field-label">{t("branches.newGroup")}</label><select required className="field" value={groupId} onChange={(event) => setGroupId(event.target.value)}><option value="">{t("branches.selectGroup")}</option>{groups.filter((group) => group.reusableGroup.branchId === Number(branchId)).map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></div><div><label className="field-label">{t("branches.transferDate")}</label><input name="transferDate" type="date" required defaultValue={new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil" }).format(new Date())} className="field" /></div><div><label className="field-label">{t("branches.reason")}</label><input name="reason" maxLength={500} className="field" /></div>{error && <p role="alert" className="text-red-700">{error}</p>}<div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border px-4 py-2">{t("admin.cancel")}</button><button className="primary-button">{t("branches.confirmChange")}</button></div></form></CycleModal>;
}

export function CycleEnrollmentsPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<AcademicCycle | null>(null);
  const [groups, setGroups] = useState<CycleGroup[]>([]);
  const [students, setStudents] = useState<AvailableStudent[]>([]);
  const [enrollments, setEnrollments] = useState<CycleEnrollment[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<AvailableStudent | null>(null);
  const [completedEnrollment, setCompletedEnrollment] = useState<{
    enrollment: CycleEnrollment;
    student: AvailableStudent;
    group: CycleGroup;
  } | null>(null);
  const [transferring, setTransferring] = useState<CycleEnrollment | null>(null);
  const selectedGroup = groups.find(
    (group) => group.id === Number(selectedGroupId),
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getCycle(id),
      cycleApi.groups(id),
      cycleApi.available(id),
      cycleApi.enrollments(id),
    ])
      .then(([cycleData, groupData, studentData, enrollmentData]) => {
        if (!cancelled) {
          setCycle(cycleData);
          setGroups(groupData);
          setStudents(studentData);
          setEnrollments(enrollmentData);
          setError("");
        }
      })
      .catch((cause) => {
        if (!cancelled)
          setError(
            t(
              cause instanceof ApiError && cause.status === 404
                ? "cycleDetail.notFound"
                : "enrollmentPage.loadError",
            ),
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const normalizedSearch = search.trim().toLocaleLowerCase("es");
  const filteredStudents = students.filter((student) =>
    `${student.dni} ${student.fullName}`
      .toLocaleLowerCase("es")
      .includes(normalizedSearch),
  );

  async function enrollmentCompleted(
    enrollment: CycleEnrollment,
    student: AvailableStudent,
    group: CycleGroup,
  ) {
    setSelectedStudent(null);
    setSuccess("");
    setCompletedEnrollment({ enrollment, student, group });
    try {
      const [available, currentEnrollments] = await Promise.all([
        cycleApi.available(id),
        cycleApi.enrollments(id),
      ]);
      setStudents(available);
      setEnrollments(currentEnrollments);
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
    setSearch(created.dni);
    setSuccess(t("enrollmentPage.studentCreated"));
  }

  return (
    <AppLayout>
      <div className="py-5">
        <Link
          to={`/admin/cycles/${id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-sky-700"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          {t("enrollmentPage.back")}
        </Link>
        {loading ? (
          <p role="status">{t("cycles.loading")}</p>
        ) : error && !cycle ? (
          <p role="alert" className="rounded-2xl bg-white p-6 text-red-700">
            {error}
          </p>
        ) : cycle ? (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight text-sky-950">
                {t("enrollmentPage.title")}
              </h1>
              <p className="mt-2 text-slate-500">
                {t("enrollmentPage.subtitle")}
              </p>
            </div>
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
            <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-sky-950">
                {cycle.name}
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <dt className="text-sm text-slate-500">
                    {t("enrollmentPage.dates")}
                  </dt>
                  <dd className="font-semibold">
                    {formatCycleDate(cycle.startDate)} –{" "}
                    {formatCycleDate(cycle.endDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">
                    {t("enrollmentPage.enrollmentFee")}
                  </dt>
                  <dd className="font-semibold">
                    {cycle.fee
                      ? money(cycle.fee.amount)
                      : t("admin.unavailable")}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">
                    {t("enrollmentPage.enrolledStudents")}
                  </dt>
                  <dd className="font-semibold">{enrollments.length}</dd>
                </div>
              </dl>
            </section>
            <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <label htmlFor="enrollment-branch" className="field-label">{t("branches.branch")}</label>
              <select id="enrollment-branch" className="field mb-4 max-w-md" value={selectedBranchId} onChange={(event) => { setSelectedBranchId(event.target.value); setSelectedGroupId(""); }}>
                <option value="">{t("branches.select")}</option>
                {cycle.branches.map(({ branch }) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </select>
              <label htmlFor="enrollment-group" className="field-label">
                {t("enrollmentPage.group")}
              </label>
              <select
                id="enrollment-group"
                className="field max-w-md"
                value={selectedGroupId}
                onChange={(event) => setSelectedGroupId(event.target.value)}
              >
                <option value="">{t("enrollmentPage.selectGroup")}</option>
                {groups.filter((group) => group.reusableGroup.branchId === Number(selectedBranchId)).map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              {!selectedGroup && (
                <p
                  role="status"
                  className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800"
                >
                  {t("enrollmentPage.selectGroupHelp")}
                </p>
              )}
              {selectedGroup && (
                <p
                  className={`mt-4 rounded-xl p-3 text-sm ${selectedGroup.pension ? "bg-cyan-50 text-sky-900" : "bg-amber-50 text-amber-800"}`}
                >
                  {selectedGroup.pension
                    ? t("enrollmentPage.pensionValue", {
                        amount: money(selectedGroup.pension.amount),
                      })
                    : t("enrollmentPage.noPension")}
                </p>
              )}
            </section>
            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div className="w-full sm:max-w-sm">
                  <label
                    htmlFor="available-student-search"
                    className="field-label"
                  >
                    {t("enrollmentPage.search")}
                  </label>
                  <div className="relative">
                    <Search
                      size={18}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="available-student-search"
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={t("enrollmentPage.searchPlaceholder")}
                      className="field pl-10"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setCreatingStudent(true)}
                >
                  <Plus size={18} aria-hidden="true" />
                  {t("enrollmentPage.createStudent")}
                </button>
              </div>
              {filteredStudents.length === 0 ? (
                <p className="py-10 text-center text-slate-500">
                  {t(
                    students.length
                      ? "enrollmentPage.noResults"
                      : "enrollmentPage.noAvailable",
                  )}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-3">{t("enrollmentPage.dni")}</th>
                        <th className="px-4 py-3">
                          {t("enrollmentPage.student")}
                        </th>
                        <th className="px-4 py-3">{t("admin.status")}</th>
                        <th className="px-4 py-3 text-right">
                          {t("admin.actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((student) => (
                        <tr key={student.id}>
                          <td className="px-4 py-4">{student.dni}</td>
                          <td className="px-4 py-4 font-semibold text-sky-950">
                            {student.fullName}
                          </td>
                          <td className="px-4 py-4">
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              {t("admin.active")}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              type="button"
                              disabled={!selectedGroup?.pension || !cycle.fee}
                              onClick={() => setSelectedStudent(student)}
                              className="primary-button ml-auto disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-100 disabled:transition-none disabled:hover:bg-slate-200"
                            >
                              {t("enrollmentPage.enroll")}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
            <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="text-xl font-semibold text-sky-950">{t("branches.currentEnrollments")}</h2><div className="mt-4 space-y-3">{enrollments.map((enrollment) => <div key={enrollment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><p className="font-semibold">{enrollment.student.fullName}</p><p className="text-sm text-slate-500">{enrollment.branch.name} · {enrollment.group.name}</p>{enrollment.transfers.length > 0 && <p className="mt-1 text-xs text-slate-500">{t("branches.transferCount", { count: enrollment.transfers.length })}</p>}</div><button className="rounded-xl border px-4 py-2 text-sm font-medium text-sky-700" onClick={() => setTransferring(enrollment)}>{t("branches.change")}</button></div>)}</div></section>
          </>
        ) : null}
        {creatingStudent && (
          <PersonModal
            title={t("admin.createByRole.STUDENT")}
            onClose={() => setCreatingStudent(false)}
          >
            <StudentForm
              onClose={() => setCreatingStudent(false)}
              onSaved={studentCreated}
            />
          </PersonModal>
        )}
        {selectedStudent && cycle && selectedGroup?.pension && cycle.fee && (
          <EnrollmentConfirmation
            cycle={cycle}
            group={selectedGroup}
            student={selectedStudent}
            onClose={() => setSelectedStudent(null)}
            onEnrolled={(enrollment) =>
              void enrollmentCompleted(
                enrollment,
                selectedStudent,
                selectedGroup,
              )
            }
          />
        )}
        {completedEnrollment && cycle && (
          <CycleModal
            title={t("enrollmentPage.successTitle")}
            busy={false}
            onClose={() => setCompletedEnrollment(null)}
          >
            <p className="text-slate-600">
              {t("enrollmentPage.successMessage", {
                student: completedEnrollment.student.fullName,
                cycle: cycle.name,
                group: completedEnrollment.group.name,
              })}
            </p>
            <dl className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
              {[
                [
                  "enrollmentPage.student",
                  completedEnrollment.student.fullName,
                ],
                ["enrollmentPage.cycle", cycle.name],
                ["enrollmentPage.group", completedEnrollment.group.name],
                [
                  "enrollmentPage.finalEnrollment",
                  money(completedEnrollment.enrollment.finalAmount),
                ],
                [
                  "enrollmentPage.finalMonthlyPension",
                  money(completedEnrollment.enrollment.pensionAmount ?? 0),
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-slate-500">{t(label)}</dt>
                  <dd className="font-semibold text-sky-950">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setCompletedEnrollment(null)}
              >
                {t("enrollmentPage.continueEnrolling")}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  navigate(
                    `/admin/payments/${completedEnrollment.enrollment.id}/manage?cycleId=${cycle.id}&returnTo=cycle`,
                  )
                }
              >
                {t("payments.register")}
              </button>
            </div>
          </CycleModal>
        )}
        {transferring && cycle && <TransferModal enrollment={transferring} cycle={cycle} groups={groups} onClose={() => setTransferring(null)} onSaved={() => { setTransferring(null); setSuccess(t("branches.transferred")); void cycleApi.enrollments(id).then(setEnrollments); }} />}
      </div>
    </AppLayout>
  );
}
