import { useEffect, useState } from "react";
import { t } from "../../lib/i18n";
import {
  cycleApi,
  type EnrollmentFee,
  type GroupAssignment,
  type ReusableGroup,
} from "./cycles";

export function GroupAssignments({
  value,
  onChange,
  disabled,
  onReady,
}: {
  value: GroupAssignment[];
  onChange: (value: GroupAssignment[]) => void;
  disabled: boolean;
  onReady: (ready: boolean) => void;
}) {
  const [groups, setGroups] = useState<ReusableGroup[]>([]);
  const [fees, setFees] = useState<EnrollmentFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const [adding, setAdding] = useState(false);
  useEffect(() => {
    let cancelled = false;
    onReady(false);
    Promise.all([cycleApi.reusableGroups(), cycleApi.reusableFees()])
      .then(([groups, fees]) => {
        if (!cancelled) {
          setGroups(groups);
          setFees(fees);
          setError(false);
          onReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [version, onReady]);
  const available = groups.filter(
    (group) => !value.some((row) => row.groupId === group.id),
  );
  return (
    <section className="space-y-4 border-t border-slate-100 pt-4">
      <h3 className="font-semibold text-sky-950">{t("cycleDetail.groups")}</h3>
      {loading ? (
        <p role="status">{t("cycles.loadingCatalogs")}</p>
      ) : error ? (
        <div role="alert">
          <p>{t("cycles.catalogError")}</p>
          <button
            type="button"
            className="primary-button mt-2"
            onClick={() => {
              setLoading(true);
              setVersion((v) => v + 1);
            }}
          >
            {t("dashboard.retry")}
          </button>
        </div>
      ) : (
        <>
          {groups.length === 0 && (
            <p className="text-sm text-slate-500">
              {t("cycles.createGroupsFirst")}
            </p>
          )}
          {fees.length === 0 && (
            <p className="text-sm text-slate-500">
              {t("cycles.createFeesFirst")}
            </p>
          )}
          <fieldset disabled={disabled} className="space-y-4">
            {value.map((row) => (
              <fieldset
                key={row.groupId}
                className="rounded-xl border border-slate-200 p-4"
              >
                <legend className="px-1 font-semibold text-sky-950">
                  {groups.find((group) => group.id === row.groupId)?.name}
                </legend>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-0 flex-1 basis-48">
                    <label
                      htmlFor={`group-fee-${row.groupId}`}
                      className="field-label"
                    >
                      {t("cycleDetail.fee")}
                    </label>
                    <select
                      id={`group-fee-${row.groupId}`}
                      className="field"
                      aria-required="true"
                      value={row.feeId ?? ""}
                      onChange={(event) =>
                        onChange(
                          value.map((group) =>
                            group.groupId === row.groupId
                              ? {
                                  ...group,
                                  feeId: event.target.value
                                    ? Number(event.target.value)
                                    : null,
                                }
                              : group,
                          ),
                        )
                      }
                    >
                      <option value="">{t("cycleDetail.selectFee")}</option>
                      {fees.map((fee) => (
                        <option key={fee.id} value={fee.id}>
                          {t("cycles.feeLabel", {
                            name: fee.name,
                            amount: t("cycles.amount", {
                              amount: Number(fee.amount).toFixed(2),
                            }),
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="rounded-xl border px-4 py-2 text-sm font-medium text-red-700"
                    onClick={() =>
                      onChange(
                        value.filter((group) => group.groupId !== row.groupId),
                      )
                    }
                  >
                    {t("cycles.removeGroup")}
                  </button>
                </div>
              </fieldset>
            ))}
            {available.length > 0 &&
              (adding ? (
                <div className="rounded-xl border border-slate-200 p-4">
                  <label htmlFor="cycle-add-group" className="field-label">
                    {t("cycleDetail.selectGroup")}
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      autoFocus
                      id="cycle-add-group"
                      className="field min-w-0 flex-1"
                      value=""
                      onChange={(event) => {
                        const groupId = Number(event.target.value);
                        if (!available.some((group) => group.id === groupId))
                          return;
                        onChange([...value, { groupId, feeId: null }]);
                        setAdding(false);
                      }}
                    >
                      <option value="">{t("cycleDetail.selectGroup")}</option>
                      {available.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="rounded-xl border px-4 py-2"
                      onClick={() => setAdding(false)}
                    >
                      {t("admin.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setAdding(true)}
                >
                  {t("cycles.addGroup")}
                </button>
              ))}
          </fieldset>
        </>
      )}
    </section>
  );
}
