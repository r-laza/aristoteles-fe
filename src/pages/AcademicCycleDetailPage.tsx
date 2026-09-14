import { CycleModal as Modal } from "../features/cycles/CycleModal";
import { EnrollmentForm } from "../features/cycles/EnrollmentForm";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { t } from "../lib/i18n";
import { ApiError } from "../services/api";
import {
  cycleApi,
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
function GroupForm({
  id,
  onClose,
  onCreated,
}: {
  id: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name")).trim();
    if (!name) {
      setError(t("cycles.invalid"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await cycleApi.createGroup(id, name);
      onCreated();
    } catch (error) {
      setError(
        t(
          error instanceof ApiError && error.status === 409
            ? "cycleDetail.groupDuplicate"
            : "cycleDetail.saveError",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={t("cycleDetail.createGroup")} busy={busy} onClose={onClose}>
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <label htmlFor="group-name" className="field-label">
          {t("cycleDetail.groupName")}
        </label>
        <input
          autoFocus
          id="group-name"
          name="name"
          required
          maxLength={100}
          disabled={busy}
          className="field"
        />
        {error && (
          <p role="alert" className="text-red-700">
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
          <button disabled={busy} className="primary-button">
            {t(busy ? "admin.saving" : "cycleDetail.createGroup")}
          </button>
        </div>
      </form>
    </Modal>
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
  const [tab, setTab] = useState<"students" | "groups">("students");
  const [modal, setModal] = useState<"group" | "enrollment" | null>(null);
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
    setSuccess(t(message));
    setLoading(true);
    setVersion((value) => value + 1);
  }
  const labels = [
    "admin.name",
    "auth.username",
    "cycleDetail.group",
    "cycles.baseFee",
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
            </div>
            <dl className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
              {[
                ["cycles.start", formatCycleDate(data.cycle.startDate)],
                ["cycles.end", formatCycleDate(data.cycle.endDate)],
                ["cycles.baseFee", amount(data.cycle.baseFee)],
                ["cycles.students", data.cycle.students],
                ["cycles.groups", data.cycle.groups],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-0 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <dt className="text-sm text-slate-500">{t(String(label))}</dt>
                  <dd className="mt-2 break-words text-lg font-semibold text-sky-950">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            {success && (
              <p
                role="status"
                className="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-800"
              >
                {success}
              </p>
            )}
            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2">
                  {(["students", "groups"] as const).map((value) => (
                    <button
                      key={value}
                      aria-pressed={tab === value}
                      onClick={() => setTab(value)}
                      className={`rounded-xl px-4 py-2 font-medium ${tab === value ? "bg-sky-50 text-sky-800" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                      {t(`cycles.${value}`)}
                    </button>
                  ))}
                </div>
                <button
                  disabled={tab === "students" && data.groups.length === 0}
                  onClick={() => {
                    setSuccess("");
                    setModal(tab === "students" ? "enrollment" : "group");
                  }}
                  className="primary-button"
                >
                  <Plus size={18} />
                  {t(
                    tab === "students"
                      ? "cycleDetail.enroll"
                      : "cycleDetail.createGroup",
                  )}
                </button>
              </div>
              {tab === "groups" ? (
                data.groups.length === 0 ? (
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
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <>
                  {data.groups.length === 0 && (
                    <p className="mb-4 rounded-xl bg-sky-50 p-3 text-sm text-sky-800">
                      {t("cycleDetail.needGroup")}
                    </p>
                  )}
                  {data.enrollments.length === 0 ? (
                    <p className="py-6 text-center text-slate-500">
                      {t("cycleDetail.noEnrollments")}
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
                            {data.enrollments.map((enrollment) => (
                              <tr
                                key={enrollment.id}
                                className="border-b border-slate-100 last:border-0"
                              >
                                {[
                                  enrollment.student.fullName,
                                  enrollment.student.username,
                                  enrollment.group.name,
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
                        {data.enrollments.map((enrollment) => (
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
                </>
              )}
            </section>
            {modal === "group" && (
              <GroupForm
                id={id}
                onClose={() => setModal(null)}
                onCreated={() => refresh("cycleDetail.groupCreated")}
              />
            )}
            {modal === "enrollment" && (
              <EnrollmentForm
                id={id}
                cycle={data.cycle}
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
