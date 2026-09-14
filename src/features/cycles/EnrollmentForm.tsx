import { useEffect, useState, type FormEvent } from "react";
import { t } from "../../lib/i18n";
import { ApiError } from "../../services/api";
import { CycleModal as Modal } from "./CycleModal";
import {
  cycleApi,
  type AcademicCycle,
  type CycleGroup,
  type AvailableStudent,
} from "./cycles";
const amount = (value: number | string) =>
  t("cycles.amount", {
    amount: Number(value).toLocaleString("es-EC", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  });
export function EnrollmentForm({
  id,
  cycle,
  groups,
  onClose,
  onCreated,
}: {
  id: string;
  cycle: AcademicCycle;
  groups: CycleGroup[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [students, setStudents] = useState<AvailableStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [discount, setDiscount] = useState("0");
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
  const finalCents =
    Math.round(cycle.baseFee * 100) - Math.round(Number(discount || "0") * 100);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !Number.isFinite(finalCents) ||
      finalCents < 0 ||
      Number(discount) < 0
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
        groupId: Number(data.get("groupId")),
        discountAmount: discount || "0",
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
                      username: student.username,
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
                defaultValue=""
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
            <div>
              <label htmlFor="enroll-base" className="field-label">
                {t("cycles.baseFee")}
              </label>
              <input
                id="enroll-base"
                readOnly
                value={amount(cycle.baseFee)}
                className="field bg-slate-50"
              />
            </div>
            <div>
              <label htmlFor="enroll-discount" className="field-label">
                {t("cycleDetail.discount")}
              </label>
              <input
                id="enroll-discount"
                type="number"
                min="0"
                max={cycle.baseFee}
                step="0.01"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                className="field"
              />
            </div>
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
            <div>
              <label htmlFor="enroll-final" className="field-label">
                {t("cycleDetail.total")}
              </label>
              <input
                id="enroll-final"
                readOnly
                value={
                  Number.isFinite(finalCents) && finalCents >= 0
                    ? amount(finalCents / 100)
                    : t("cycleDetail.invalidDiscount")
                }
                className="field bg-sky-50 font-semibold"
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
              disabled={busy || students.length === 0 || finalCents < 0}
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
