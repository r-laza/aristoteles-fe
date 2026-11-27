import { useState } from "react";
import { t } from "../../lib/i18n";
import { ApiError } from "../../services/api";
import { CycleModal } from "./CycleModal";
import {
  cycleApi,
  type AcademicCycle,
} from "./cycles";

export function DeleteCycleModal({
  cycle,
  onClose,
  onDeleted,
}: {
  cycle: AcademicCycle;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [inUse, setInUse] = useState(cycle.students > 0);
  const [error, setError] = useState(false);
  async function remove() {
    if (busy || inUse) return;
    setBusy(true);
    setError(false);
    try {
      await cycleApi.deleteCycle(cycle.id);
      onDeleted();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) setInUse(true);
      else setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <CycleModal
      title={t("cycleActions.deleteTitle")}
      busy={busy}
      onClose={onClose}
    >
      <p className="mb-3 break-words font-semibold text-sky-950">
        {cycle.name}
      </p>
      {inUse ? (
        <p
          role="alert"
          className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800"
        >
          {t("cycleActions.inUse")}
        </p>
      ) : (
        <>
          <p className="text-slate-500">
            {t("cycleActions.deleteDescription")}
          </p>
          {cycle.groups > 0 && (
            <p className="mt-3 text-sm text-slate-500">
              {t("cycleActions.relationships")}
            </p>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {t("cycleActions.deleteError")}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button
          autoFocus
          type="button"
          disabled={busy}
          onClick={onClose}
          className="rounded-xl border px-4 py-2"
        >
          {t("admin.cancel")}
        </button>
        <button
          type="button"
          disabled={busy || inUse}
          onClick={remove}
          className="rounded-xl bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t(busy ? "cycleActions.deleting" : "cycleActions.delete")}
        </button>
      </div>
    </CycleModal>
  );
}
