import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { t } from "../../lib/i18n";
import { ApiError } from "../../services/api";
import {
  saveCycle,
  type AcademicCycle,
  type CycleGroup,
  type GroupAssignment,
} from "./cycles";
import { GroupAssignments } from "./GroupAssignments";
export function CycleForm({
  cycle,
  initialGroups = [],
  onClose,
  onCreated,
}: {
  cycle?: AcademicCycle;
  initialGroups?: CycleGroup[];
  onClose: () => void;
  onCreated: (cycle: AcademicCycle) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState(cycle?.startDate ?? "");
  const [groups, setGroups] = useState<GroupAssignment[]>(
    initialGroups.map((group) => ({
      groupId: group.reusableGroupId,
      feeId: group.fees.length === 1 ? group.fees[0].id : null,
    })),
  );
  const [ready, setReady] = useState(false);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name")).trim();
    const endDate = String(data.get("endDate"));
    if (!name || !startDate || !endDate) {
      setError(t("cycles.invalid"));
      return;
    }
    if (endDate < startDate) {
      setError(t("cycles.invalidDates"));
      return;
    }
    if (
      !ready ||
      !groups.length ||
      groups.some((group) => group.feeId === null) ||
      new Set(groups.map((group) => group.groupId)).size !== groups.length
    ) {
      setError(t("cycles.assignmentsRequired"));
      return;
    }
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      onCreated(
        await saveCycle(
          {
            name,
            startDate,
            endDate,
            groups,
          },
          cycle?.id,
        ),
      );
    } catch (error) {
      setError(
        t(
          error instanceof ApiError && error.status === 409
            ? "cycles.assignmentConflict"
            : "cycles.saveError",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      aria-labelledby="cycle-modal-title"
      className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 text-slate-800 shadow-xl backdrop:bg-slate-950/50"
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 id="cycle-modal-title" className="text-xl font-bold text-sky-950">
          {t(cycle ? "cycles.edit" : "cycles.create")}
        </h2>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label={t("admin.close")}
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <fieldset disabled={busy} className="space-y-4">
          <div>
            <label htmlFor="cycle-name" className="field-label">
              {t("cycles.name")}
            </label>
            <input
              defaultValue={cycle?.name}
              autoFocus
              id="cycle-name"
              name="name"
              required
              maxLength={100}
              className="field"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cycle-start" className="field-label">
                {t("cycles.startDate")}
              </label>
              <input
                id="cycle-start"
                name="startDate"
                type="date"
                required
                max="9999-12-31"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="field"
              />
            </div>
            <div>
              <label htmlFor="cycle-end" className="field-label">
                {t("cycles.endDate")}
              </label>
              <input
                defaultValue={cycle?.endDate}
                id="cycle-end"
                name="endDate"
                type="date"
                required
                min={startDate || undefined}
                max="9999-12-31"
                className="field"
              />
            </div>
          </div>
          <GroupAssignments
            value={groups}
            onChange={setGroups}
            disabled={busy}
            onReady={setReady}
          />
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-xl border px-4 py-2"
            >
              {t("admin.cancel")}
            </button>
            <button disabled={busy || !ready} className="primary-button">
              {t(
                busy
                  ? "admin.saving"
                  : cycle
                    ? "cycleDetail.save"
                    : "cycles.create",
              )}
            </button>
          </div>
        </fieldset>
      </form>
    </dialog>
  );
}
