import { useState, type FormEvent } from "react";
import { t } from "../../lib/i18n";
import { ApiError } from "../../services/api";
import { CycleModal as Modal } from "./CycleModal";
import {
  cycleApi,
  todayKey,
  type ReusableGroup,
  type EnrollmentFee,
} from "./cycles";

export function GroupForm({
  group,
  onClose,
  onCreated,
}: {
  group?: ReusableGroup;
  onClose: () => void;
  onCreated: (group: ReusableGroup) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name")).trim();
    if (!name || busy) return;
    setBusy(true);
    setError("");
    try {
      onCreated(await cycleApi.saveGroup(name, group?.id));
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
    <Modal
      title={t(group ? "cycleDetail.editGroup" : "cycleDetail.createGroup")}
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <label htmlFor="group-name" className="field-label">
          {t("cycleDetail.groupName")}
        </label>
        <input
          id="group-name"
          name="name"
          autoFocus
          required
          maxLength={100}
          defaultValue={group?.name}
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
            {t(busy ? "admin.saving" : "cycleDetail.save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function FeeForm({
  fee,
  onClose,
  onCreated,
}: {
  fee?: EnrollmentFee;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [from, setFrom] = useState(fee?.validFrom.slice(0, 10) ?? todayKey());
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await cycleApi.saveFee(
        {
          name: String(data.get("name")).trim(),
          amount: String(data.get("amount")),
          validFrom: from,
          validUntil: String(data.get("validUntil")),
        },
        fee?.id,
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
      title={t(fee ? "cycles.editFee" : "cycleDetail.addFee")}
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <fieldset disabled={busy} className="space-y-4">
          <div>
            <label htmlFor="fee-name" className="field-label">
              {t("admin.name")}
            </label>
            <input
              autoFocus
              defaultValue={fee?.name}
              id="fee-name"
              name="name"
              required
              maxLength={100}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="fee-amount" className="field-label">
              {t("cycleDetail.feeAmount")}
            </label>
            <input
              defaultValue={fee?.amount}
              id="fee-amount"
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
            <label htmlFor="fee-from" className="field-label">
              {t("cycleDetail.validFrom")}
            </label>
            <input
              id="fee-from"
              type="date"
              required
              max="9999-12-31"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="fee-until" className="field-label">
              {t("cycleDetail.validUntil")}
            </label>
            <input
              defaultValue={fee?.validUntil?.slice(0, 10)}
              id="fee-until"
              name="validUntil"
              type="date"
              min={from}
              max="9999-12-31"
              className="field"
            />
          </div>
        </fieldset>
        <p className="text-sm text-slate-500">{t("cycles.sharedFeeHint")}</p>
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
