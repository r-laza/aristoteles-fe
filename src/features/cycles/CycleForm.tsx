import { useEffect, useState, type FormEvent } from "react";
import { t } from "../../lib/i18n";
import { ApiError } from "../../services/api";
import {
  cycleApi,
  type EnrollmentFee,
  saveCycle,
  type AcademicCycle,
  type CycleGroup,
  type GroupAssignment,
  type Branch,
  type CycleCategory,
} from "./cycles";
import { GroupAssignments } from "./GroupAssignments";

type ValidationErrors = Record<string, string>;
const invalidFieldClass =
  "!border-red-500 focus:!border-red-500 focus:!ring-red-200";

function fieldClass(invalid: boolean, extra = "") {
  return `field ${extra} ${invalid ? invalidFieldClass : ""}`.trim();
}

function focusFirstInvalid(form: HTMLFormElement, errors: ValidationErrors) {
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return;
  window.requestAnimationFrame(() => {
    form
      .querySelector<HTMLElement>(`[data-validation-key="${firstKey}"]`)
      ?.focus();
  });
}
export function CycleForm({
  cycle,
  initialGroups = [],
  onCancel,
  onCreated,
}: {
  cycle?: AcademicCycle;
  initialGroups?: CycleGroup[];
  onCancel: () => void;
  onCreated: (cycle: AcademicCycle) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [name, setName] = useState(cycle?.name ?? "");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchIds, setBranchIds] = useState<number[]>(
    cycle?.branches.map((row) => row.branch.id) ?? [],
  );
  const [branchToAdd, setBranchToAdd] = useState("");
  const [startDate, setStartDate] = useState(cycle?.startDate ?? "");
  const [endDate, setEndDate] = useState(cycle?.endDate ?? "");
  const [groups, setGroups] = useState<GroupAssignment[]>(
    initialGroups.map((group) => ({
      branchId: group.branch.id,
      groupId: group.reusableGroupId,
      pensionId: group.pensionId,
    })),
  );
  const [fees, setFees] = useState<EnrollmentFee[]>([]);
  const [feeId, setFeeId] = useState<number | "">(cycle?.feeId ?? "");
  const [category, setCategory] = useState<CycleCategory>(
    cycle?.category ?? "SCHOOL",
  );
  const [feesReady, setFeesReady] = useState(false);
  const [feeLoadError, setFeeLoadError] = useState(false);
  const [feeVersion, setFeeVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    cycleApi
      .reusableFees()
      .then((data) => {
        if (!cancelled) {
          setFees(data);
          setFeesReady(true);
          setFeeLoadError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setFeeLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [feeVersion]);
  useEffect(() => {
    void cycleApi
      .branches()
      .then((rows) => setBranches(rows.filter((row) => row.isActive)))
      .catch(() => setError(t("branches.loadError")));
  }, []);
  const [ready, setReady] = useState(false);
  function clearValidation(...keys: string[]) {
    setError("");
    setValidationErrors((current) => {
      if (!keys.some((key) => current[key])) return current;
      const next = { ...current };
      keys.forEach((key) => delete next[key]);
      return next;
    });
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors: ValidationErrors = {};
    if (!name.trim()) nextErrors.name = t("cycles.validation.nameRequired");
    if (!category)
      nextErrors.category = t("cycles.validation.categoryRequired");
    if (!startDate)
      nextErrors.startDate = t("cycles.validation.startDateRequired");
    if (!endDate) nextErrors.endDate = t("cycles.validation.endDateRequired");
    else if (startDate && endDate <= startDate)
      nextErrors.endDate = t("cycles.validation.endAfterStart");
    if (category === "SCHOOL" && !feeId)
      nextErrors.fee = t("cycles.validation.moduleRequired");
    if (!branchIds.length)
      nextErrors.branches = t("cycles.validation.branchRequired");
    if (!groups.length)
      nextErrors.groups = t("cycles.validation.groupRequired");
    groups.forEach((group) => {
      if (group.pensionId === null)
        nextErrors[`pension-${group.branchId}-${group.groupId}`] = t(
          "cycles.validation.pensionRequired",
        );
    });
    if (Object.keys(nextErrors).length) {
      setValidationErrors(nextErrors);
      setError("");
      focusFirstInvalid(form, nextErrors);
      return;
    }
    setValidationErrors({});
    if (!ready) {
      setError(t("cycles.catalogError"));
      return;
    }
    if (category === "SCHOOL" && !feesReady) {
      setError(t("cycles.catalogError"));
      return;
    }
    if (
      new Set(groups.map((group) => `${group.branchId}:${group.groupId}`))
        .size !== groups.length
    ) {
      setError(t("cycles.duplicateGroup"));
      return;
    }
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      onCreated(
        await saveCycle(
          {
            name: name.trim(),
            startDate,
            endDate,
            groups,
            branchIds,
            category,
            feeId: category === "SCHOOL" ? Number(feeId) : null,
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
    <form onSubmit={submit} noValidate className="space-y-6">
      {Object.keys(validationErrors).length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p className="font-semibold">{t("cycles.validation.summary")}</p>
          <p className="mt-1">{t("cycles.validation.summaryHelp")}</p>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      )}
      <fieldset disabled={busy} className="space-y-6">
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-5 text-lg font-bold text-sky-950">
            {t("cycles.generalInformation")}
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label htmlFor="cycle-name" className="field-label">
                {t("cycles.name")}
              </label>
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (event.target.value.trim()) clearValidation("name");
                }}
                autoFocus
                id="cycle-name"
                name="name"
                required
                maxLength={100}
                aria-invalid={Boolean(validationErrors.name)}
                aria-describedby={
                  validationErrors.name ? "cycle-name-error" : undefined
                }
                data-validation-key="name"
                className={fieldClass(Boolean(validationErrors.name))}
              />
              {validationErrors.name && (
                <p id="cycle-name-error" className="mt-1 text-sm text-red-700">
                  {validationErrors.name}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="cycle-category" className="field-label">
                {t("cycles.category")}
              </label>
              <select
                id="cycle-category"
                required
                disabled={Boolean(cycle)}
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value as CycleCategory);
                  clearValidation("category", "fee");
                }}
                aria-invalid={Boolean(validationErrors.category)}
                aria-describedby={
                  validationErrors.category ? "cycle-category-error" : undefined
                }
                data-validation-key="category"
                className={fieldClass(Boolean(validationErrors.category))}
              >
                <option value="SCHOOL">{t("cycles.school")}</option>
                <option value="PREUNIVERSITY">
                  {t("cycles.preuniversity")}
                </option>
              </select>
              {validationErrors.category && (
                <p
                  id="cycle-category-error"
                  className="mt-1 text-sm text-red-700"
                >
                  {validationErrors.category}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
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
                  onChange={(event) => {
                    setStartDate(event.target.value);
                    if (event.target.value) clearValidation("startDate");
                    if (
                      endDate &&
                      event.target.value &&
                      endDate > event.target.value
                    )
                      clearValidation("endDate");
                  }}
                  aria-invalid={Boolean(validationErrors.startDate)}
                  aria-describedby={
                    validationErrors.startDate ? "cycle-start-error" : undefined
                  }
                  data-validation-key="startDate"
                  className={fieldClass(Boolean(validationErrors.startDate))}
                />
                {validationErrors.startDate && (
                  <p
                    id="cycle-start-error"
                    className="mt-1 text-sm text-red-700"
                  >
                    {validationErrors.startDate}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="cycle-end" className="field-label">
                  {t("cycles.endDate")}
                </label>
                <input
                  value={endDate}
                  id="cycle-end"
                  name="endDate"
                  type="date"
                  required
                  min={startDate || undefined}
                  max="9999-12-31"
                  onChange={(event) => {
                    setEndDate(event.target.value);
                    if (
                      event.target.value &&
                      (!startDate || event.target.value > startDate)
                    )
                      clearValidation("endDate");
                  }}
                  aria-invalid={Boolean(validationErrors.endDate)}
                  aria-describedby={
                    validationErrors.endDate ? "cycle-end-error" : undefined
                  }
                  data-validation-key="endDate"
                  className={fieldClass(Boolean(validationErrors.endDate))}
                />
                {validationErrors.endDate && (
                  <p id="cycle-end-error" className="mt-1 text-sm text-red-700">
                    {validationErrors.endDate}
                  </p>
                )}
              </div>
            </div>
            {category === "SCHOOL" ? (
              <div className="lg:col-span-2">
                <label htmlFor="cycle-fee" className="field-label">
                  {t("pensionCatalog.generalFee")}
                </label>
                <select
                  id="cycle-fee"
                  required
                  value={feeId}
                  onChange={(event) => {
                    setFeeId(
                      event.target.value ? Number(event.target.value) : "",
                    );
                    if (event.target.value) clearValidation("fee");
                  }}
                  aria-invalid={Boolean(validationErrors.fee)}
                  aria-describedby={
                    validationErrors.fee ? "cycle-fee-error" : undefined
                  }
                  data-validation-key="fee"
                  className={fieldClass(Boolean(validationErrors.fee))}
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
                {validationErrors.fee && (
                  <p id="cycle-fee-error" className="mt-1 text-sm text-red-700">
                    {validationErrors.fee}
                  </p>
                )}
                <p className="mt-2 text-sm text-slate-500">
                  {t("pensionCatalog.generalFeeHint")}
                </p>
                {feeLoadError && (
                  <div role="alert">
                    {t("cycles.catalogError")}
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => setFeeVersion((v) => v + 1)}
                    >
                      {t("dashboard.retry")}
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </section>
        <>
          <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-sky-950">
              {t("cycles.branchesSection")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t("branches.cycleAvailability")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <select
                id="cycle-branch-selector"
                className={fieldClass(
                  Boolean(validationErrors.branches),
                  "min-w-48 flex-1",
                )}
                value={branchToAdd}
                aria-invalid={Boolean(validationErrors.branches)}
                aria-describedby={
                  validationErrors.branches ? "cycle-branches-error" : undefined
                }
                data-validation-key="branches"
                onChange={(event) => setBranchToAdd(event.target.value)}
              >
                <option value="">{t("branches.select")}</option>
                {branches
                  .filter((branch) => !branchIds.includes(branch.id))
                  .map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                className="primary-button"
                disabled={!branchToAdd}
                onClick={() => {
                  setBranchIds((current) => [...current, Number(branchToAdd)]);
                  setBranchToAdd("");
                  clearValidation("branches");
                }}
              >
                {t("branches.addToCycle")}
              </button>
            </div>
            {validationErrors.branches && (
              <p
                id="cycle-branches-error"
                className="mt-1 text-sm text-red-700"
              >
                {validationErrors.branches}
              </p>
            )}
            {branchIds.length > 0 && (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {branchIds.map((branchId) => (
                  <li
                    key={branchId}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                  >
                    <span className="truncate font-medium text-sky-950">
                      {branches.find((branch) => branch.id === branchId)?.name}
                    </span>
                    <button
                      type="button"
                      className="text-sm font-semibold text-red-700"
                      onClick={() => {
                        setBranchIds((current) =>
                          current.filter((id) => id !== branchId),
                        );
                        setGroups((current) =>
                          current.filter(
                            (group) => group.branchId !== branchId,
                          ),
                        );
                      }}
                    >
                      {t("branches.removeFromCycle")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section
            className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-6 ${validationErrors.groups ? "border-red-300" : "border-slate-100"}`}
            tabIndex={-1}
            data-validation-key="groups"
            aria-invalid={Boolean(validationErrors.groups)}
            aria-describedby={
              validationErrors.groups ? "cycle-groups-error" : undefined
            }
          >
            <h2 className="text-lg font-bold text-sky-950">
              {t("cycles.groupsByBranch")}
            </h2>
            {validationErrors.groups && (
              <p id="cycle-groups-error" className="mt-1 text-sm text-red-700">
                {validationErrors.groups}
              </p>
            )}
            <GroupAssignments
              value={groups}
              branchIds={branchIds}
              branches={branches}
              onChange={(nextGroups) => {
                setGroups(nextGroups);
                if (nextGroups.length) clearValidation("groups");
                const retainedKeys = new Set(
                  nextGroups.map(
                    (group) => `pension-${group.branchId}-${group.groupId}`,
                  ),
                );
                setValidationErrors((current) =>
                  Object.fromEntries(
                    Object.entries(current).filter(
                      ([key]) =>
                        !key.startsWith("pension-") || retainedKeys.has(key),
                    ),
                  ),
                );
              }}
              disabled={busy}
              onReady={setReady}
              requirePension
              validationErrors={validationErrors}
              onValidationChange={clearValidation}
            />
          </section>
        </>
        <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="secondary-button min-h-11 justify-center"
          >
            {t("admin.cancel")}
          </button>
          <button
            disabled={busy || !ready || (category === "SCHOOL" && !feesReady)}
            className="primary-button min-h-11 justify-center"
          >
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
  );
}
