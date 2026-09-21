import { useState, type FormEvent } from "react";
import { t } from "../../lib/i18n";
import { CycleModal as Modal } from "./CycleModal";
import { cycleApi, type Pension } from "./cycles";

export function PensionForm({
  pension,
  onClose,
  onCreated,
}: {
  pension?: Pension;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await cycleApi.savePension(
        {
          name: String(data.get("name")).trim(),
          amount: String(data.get("amount")),
          dueDay: Number(data.get("dueDay")),
          isActive: data.get("isActive") === "on",
        },
        pension?.id,
      );
      onCreated();
    } catch {
      setError(t("cycleDetail.saveError"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={t(pension ? "cycles.editPension" : "pensionCatalog.add")}
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <fieldset disabled={busy} className="space-y-4">
          <div>
            <label htmlFor="pension-name" className="field-label">
              {t("admin.name")}
            </label>
            <input
              autoFocus
              defaultValue={pension?.name}
              id="pension-name"
              name="name"
              required
              maxLength={100}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="pension-amount" className="field-label">
              {t("pensionCatalog.monthlyAmount")}
            </label>
            <input
              defaultValue={pension?.amount}
              id="pension-amount"
              name="amount"
              type="number"
              required
              min="0"
              max="9999999999.99"
              step="0.01"
              className="field"
            />
          </div>
          <div>
            <label htmlFor="pension-due" className="field-label">
              {t("pensionCatalog.dueDay")}
            </label>
            <input
              id="pension-due"
              name="dueDay"
              type="number"
              min="1"
              max="31"
              step="1"
              required
              defaultValue={pension?.dueDay ?? 1}
              className="field"
            />
            <p className="mt-2 text-sm text-slate-500">
              {t("pensionCatalog.dueHint")}
            </p>
          </div>
          <label className="flex items-center gap-2">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={pension?.isActive ?? true}
            />
            {t("pensionCatalog.active")}
          </label>
        </fieldset>
        <p className="text-sm text-slate-500">
          {t("pensionCatalog.sharedHint")}
        </p>
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
            {t(busy ? "admin.saving" : "cycleDetail.save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
