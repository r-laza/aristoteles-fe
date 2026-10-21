import { useEffect, useState, type FormEvent } from "react";
import { t } from "../../lib/i18n";
import { ApiError } from "../../services/api";
import { CycleModal as Modal } from "./CycleModal";
import {
  cycleApi,
  type CycleGroup,
  type AvailableStudent,
  type EnrollmentFee,
} from "./cycles";
import { calculateDiscount } from "./enrollment";
const amount = (value: number | string) =>
  t("cycles.amount", {
    amount: Number(value).toLocaleString("es-EC", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  });
export function EnrollmentForm({
  id,
  fee,
  groups,
  onClose,
  onCreated,
}: {
  id: string;
  fee: EnrollmentFee | null;
  groups: CycleGroup[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [students, setStudents] = useState<AvailableStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [groupId, setGroupId] = useState("");
  const selectedGroup = groups.find((group) => group.id === Number(groupId));
  const pension = selectedGroup?.pension ?? null;
  const baseFee = Number(fee?.amount ?? 0);
  const pensionBase = Number(pension?.amount ?? 0);
  const [enrollmentDiscountPercent, setEnrollmentDiscountPercent] =
    useState("0");
  const [pensionDiscountPercent, setPensionDiscountPercent] = useState("0");
  useEffect(() => {
    let cancelled = false;
    cycleApi
      .available(id)
      .then((users) => {
        if (!cancelled) setStudents(users);
      })
      .catch(() => {
        if (!cancelled) setError(t("cycleDetail.loadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);
  const enrollmentDiscount = calculateDiscount(
    baseFee,
    enrollmentDiscountPercent,
  );
  const pensionDiscount = calculateDiscount(
    pensionBase,
    pensionDiscountPercent,
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !fee ||
      !pension ||
      !enrollmentDiscount.valid ||
      !pensionDiscount.valid
    ) {
      setError(t("cycleDetail.invalidDiscount"));
      return;
    }
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await cycleApi.enroll(id, {
        studentId: Number(data.get("studentId")),
        groupId: Number(groupId),
        branchId: groups.find((group) => group.id === Number(groupId))!.reusableGroup.branchId,
        discountPercent: enrollmentDiscountPercent || "0",
        pensionDiscountPercent: pensionDiscountPercent || "0",
        discountReason: String(data.get("discountReason")).trim(),
      });
      onCreated();
    } catch (error) {
      setError(
        t(
          error instanceof ApiError && error.status === 409
            ? "cycleDetail.duplicate"
            : "cycleDetail.saveError",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={t("cycleDetail.enroll")} busy={busy} onClose={onClose}>
      {loading ? (
        <p role="status">{t("cycles.loading")}</p>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <fieldset disabled={busy} className="space-y-4">
            <div>
              <label htmlFor="enroll-student" className="field-label">
                {t("cycleDetail.student")}
              </label>
              <select
                autoFocus
                id="enroll-student"
                name="studentId"
                required
                defaultValue=""
                className="field"
              >
                <option value="" disabled>
                  {t("cycleDetail.selectStudent")}
                </option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {t("cycleDetail.studentOption", {
                      name: student.fullName,
                      dni: student.dni,
                    })}
                  </option>
                ))}
              </select>
              {students.length === 0 && (
                <p className="mt-2 text-sm text-slate-500">
                  {t("cycleDetail.noAvailable")}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="enroll-group" className="field-label">
                {t("cycleDetail.group")}
              </label>
              <select
                id="enroll-group"
                name="groupId"
                required
                value={groupId}
                onChange={(event) => setGroupId(event.target.value)}
                className="field"
              >
                <option value="" disabled>
                  {t("cycleDetail.selectGroup")}
                </option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <section className="space-y-4 rounded-xl border border-slate-200 p-4">
              <div>
                <h3 className="font-semibold text-sky-950">
                  {t("cycleDetail.enrollmentFee")}
                </h3>
                {fee ? (
                  <p className="mt-1 text-sm text-slate-600">
                    {fee.name} ·{" "}
                    {t("cycleDetail.value", { value: amount(baseFee) })}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">
                    {t("cycleDetail.noCycleFee")}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="enroll-discount" className="field-label">
                  {t("cycleDetail.enrollmentDiscountPercent")}
                </label>
                <input
                  id="enroll-discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={enrollmentDiscountPercent}
                  onChange={(event) =>
                    setEnrollmentDiscountPercent(event.target.value)
                  }
                  className="field"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="field-label">
                    {t("cycleDetail.discountApplied")}
                  </label>
                  <input
                    readOnly
                    value={
                      enrollmentDiscount.valid
                        ? amount(enrollmentDiscount.discountCents / 100)
                        : t("cycleDetail.invalidDiscount")
                    }
                    className="field bg-slate-50"
                  />
                </div>
                <div>
                  <label className="field-label">
                    {t("cycleDetail.totalEnrollment")}
                  </label>
                  <input
                    readOnly
                    value={
                      enrollmentDiscount.valid
                        ? amount(enrollmentDiscount.finalCents / 100)
                        : t("cycleDetail.invalidDiscount")
                    }
                    className="field bg-sky-50 font-semibold"
                  />
                </div>
              </div>
            </section>
            {pension && (
              <section className="space-y-4 rounded-xl border border-slate-200 p-4">
                <div>
                  <h3 className="font-semibold text-sky-950">
                    {t("cycleDetail.pension")}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{pension.name}</p>
                  <dl className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                    <div>
                      <dt className="inline">
                        {t("cycleDetail.monthlyValue")}:{" "}
                      </dt>
                      <dd className="inline font-medium">
                        {amount(pensionBase)}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline">{t("cycleDetail.dueDay")}: </dt>
                      <dd className="inline font-medium">{pension.dueDay}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <label htmlFor="pension-discount" className="field-label">
                    {t("cycleDetail.pensionDiscountPercent")}
                  </label>
                  <input
                    id="pension-discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={pensionDiscountPercent}
                    onChange={(event) =>
                      setPensionDiscountPercent(event.target.value)
                    }
                    className="field"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="field-label">
                      {t("cycleDetail.discountApplied")}
                    </label>
                    <input
                      readOnly
                      value={
                        pensionDiscount.valid
                          ? amount(pensionDiscount.discountCents / 100)
                          : t("cycleDetail.invalidDiscount")
                      }
                      className="field bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="field-label">
                      {t("cycleDetail.monthlyTotal")}
                    </label>
                    <input
                      readOnly
                      value={
                        pensionDiscount.valid
                          ? amount(pensionDiscount.finalCents / 100)
                          : t("cycleDetail.invalidDiscount")
                      }
                      className="field bg-sky-50 font-semibold"
                    />
                  </div>
                </div>
              </section>
            )}
            <div>
              <label htmlFor="enroll-reason" className="field-label">
                {t("cycleDetail.discountReason")}
              </label>
              <input
                id="enroll-reason"
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
              disabled={
                busy ||
                !fee ||
                !pension ||
                students.length === 0 ||
                !enrollmentDiscount.valid ||
                !pensionDiscount.valid
              }
              className="primary-button"
            >
              {t(busy ? "admin.saving" : "cycleDetail.enroll")}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
