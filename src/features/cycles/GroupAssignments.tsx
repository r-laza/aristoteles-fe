import { useEffect, useState } from "react";
import { t } from "../../lib/i18n";
import {
  cycleApi,
  type Pension,
  type GroupAssignment,
  type ReusableGroup,
  type Branch,
} from "./cycles";

export function GroupAssignments({
  value,
  onChange,
  disabled,
  onReady,
  branchIds,
  branches,
  requirePension = true,
  validationErrors = {},
  onValidationChange,
}: {
  value: GroupAssignment[];
  onChange: (value: GroupAssignment[]) => void;
  disabled: boolean;
  onReady: (ready: boolean) => void;
  branchIds: number[];
  branches: Branch[];
  requirePension?: boolean;
  validationErrors?: Record<string, string>;
  onValidationChange?: (...keys: string[]) => void;
}) {
  const [groups, setGroups] = useState<ReusableGroup[]>([]);
  const [fees, setFees] = useState<Pension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const [addingBranch, setAddingBranch] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    onReady(false);
    Promise.all([cycleApi.reusableGroups(), cycleApi.reusablePensions()])
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
          {requirePension && fees.length === 0 && (
            <p className="text-sm text-slate-500">
              {t("pensionCatalog.createFirst")}
            </p>
          )}
          <fieldset disabled={disabled} className="space-y-4">
            {branchIds.map((branchId) => {
              const branch = branches.find((item) => item.id === branchId);
              const branchRows = value.filter(
                (row) => row.branchId === branchId,
              );
              const branchAvailable = groups.filter(
                (group) => !branchRows.some((row) => row.groupId === group.id),
              );
              return (
                <section
                  key={branchId}
                  className="space-y-3 rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="font-semibold text-sky-950">
                      {branch?.name ?? t("branches.branch")}
                    </h4>
                    {branchAvailable.length > 0 &&
                      addingBranch !== branchId && (
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => setAddingBranch(branchId)}
                        >
                          {t("cycles.addGroup")}
                        </button>
                      )}
                  </div>
                  {branchRows.map((row) => (
                    <fieldset
                      key={row.groupId}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <legend className="px-1 font-semibold text-sky-950">
                        {groups.find((group) => group.id === row.groupId)?.name}
                      </legend>
                      <div className="flex flex-wrap items-end gap-3">
                        {requirePension && (
                          <div className="min-w-0 flex-1 basis-48">
                            <label
                              htmlFor={`group-fee-${branchId}-${row.groupId}`}
                              className="field-label"
                            >
                              {t("pensionCatalog.pension")}
                            </label>
                            <select
                              id={`group-fee-${branchId}-${row.groupId}`}
                              className={`field ${validationErrors[`pension-${branchId}-${row.groupId}`] ? "!border-red-500 focus:!border-red-500 focus:!ring-red-200" : ""}`}
                              aria-required="true"
                              aria-invalid={Boolean(
                                validationErrors[
                                  `pension-${branchId}-${row.groupId}`
                                ],
                              )}
                              aria-describedby={
                                validationErrors[
                                  `pension-${branchId}-${row.groupId}`
                                ]
                                  ? `group-fee-${branchId}-${row.groupId}-error`
                                  : undefined
                              }
                              data-validation-key={`pension-${branchId}-${row.groupId}`}
                              value={row.pensionId ?? ""}
                              onChange={(event) => {
                                onChange(
                                  value.map((group) =>
                                    group.branchId === branchId &&
                                    group.groupId === row.groupId
                                      ? {
                                          ...group,
                                          pensionId: event.target.value
                                            ? Number(event.target.value)
                                            : null,
                                        }
                                      : group,
                                  ),
                                );
                                if (event.target.value)
                                  onValidationChange?.(
                                    `pension-${branchId}-${row.groupId}`,
                                  );
                              }}
                            >
                              <option value="">
                                {t("pensionCatalog.select")}
                              </option>
                              {fees.map((fee) => (
                                <option key={fee.id} value={fee.id}>
                                  {t("pensionCatalog.monthlyLabel", {
                                    name: fee.name,
                                    amount: t("cycles.amount", {
                                      amount: Number(fee.amount).toFixed(2),
                                    }),
                                  })}
                                </option>
                              ))}
                            </select>
                            {validationErrors[
                              `pension-${branchId}-${row.groupId}`
                            ] && (
                              <p
                                id={`group-fee-${branchId}-${row.groupId}-error`}
                                className="mt-1 text-sm text-red-700"
                              >
                                {
                                  validationErrors[
                                    `pension-${branchId}-${row.groupId}`
                                  ]
                                }
                              </p>
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          className="rounded-xl border px-4 py-2 text-sm font-medium text-red-700"
                          onClick={() =>
                            onChange(
                              value.filter(
                                (group) =>
                                  !(
                                    group.branchId === branchId &&
                                    group.groupId === row.groupId
                                  ),
                              ),
                            )
                          }
                        >
                          {t("cycles.removeGroup")}
                        </button>
                      </div>
                    </fieldset>
                  ))}
                  {addingBranch === branchId && branchAvailable.length > 0 && (
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
                            if (
                              !branchAvailable.some(
                                (group) => group.id === groupId,
                              )
                            )
                              return;
                            onChange([
                              ...value,
                              { branchId, groupId, pensionId: null },
                            ]);
                            setAddingBranch(null);
                          }}
                        >
                          <option value="">
                            {t("cycleDetail.selectGroup")}
                          </option>
                          {branchAvailable.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="rounded-xl border px-4 py-2"
                          onClick={() => setAddingBranch(null)}
                        >
                          {t("admin.cancel")}
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </fieldset>
        </>
      )}
    </section>
  );
}
