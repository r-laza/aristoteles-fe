import { t } from "../../lib/i18n";
import { periodLabel } from "./formatting";
import type { PaymentFiltersValue } from "./paymentView";
export function PaymentFilters({
  filters,
  groups,
  months,
  onChange,
}: {
  filters: PaymentFiltersValue;
  groups: { id: number; name: string }[];
  months: string[];
  onChange: (value: PaymentFiltersValue) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
      <div className="sm:col-span-2">
        <label htmlFor="payments-search" className="field-label">
          {t("payments.search")}
        </label>
        <input
          id="payments-search"
          type="search"
          className="field !py-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-400"
          value={filters.search}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
        />
      </div>
      <div>
        <label htmlFor="payments-group" className="field-label">
          {t("cycleDetail.group")}
        </label>
        <select
          id="payments-group"
          className="field !py-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-400"
          value={filters.group}
          onChange={(event) =>
            onChange({ ...filters, group: event.target.value })
          }
        >
          <option value="">{t("payments.all")}</option>
          {groups.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="payments-type" className="field-label">
          {t("payments.type")}
        </label>
        <select
          id="payments-type"
          className="field !py-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-400"
          value={filters.type}
          onChange={(event) => {
            onChange({
              ...filters,
              type: event.target.value,
              month: event.target.value === "ENROLLMENT" ? "" : filters.month,
            });
          }}
        >
          <option value="">{t("payments.all")}</option>
          {["ENROLLMENT", "PENSION"].map((item) => (
            <option key={item} value={item}>
              {t(`payments.types.${item}`)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="payments-status" className="field-label">
          {t("admin.status")}
        </label>
        <select
          id="payments-status"
          className="field !py-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-400"
          value={filters.status}
          onChange={(event) =>
            onChange({ ...filters, status: event.target.value })
          }
        >
          <option value="">{t("payments.all")}</option>
          {["PAID", "PARTIAL", "PENDING", "NA"].map((item) => (
            <option key={item} value={item}>
              {t(`payments.accountStatus.${item}`)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="payments-month" className="field-label">
          {t("payments.month")}
        </label>
        <select
          id="payments-month"
          className="field !py-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-400"
          value={filters.month}
          disabled={filters.type === "ENROLLMENT"}
          onChange={(event) =>
            onChange({ ...filters, month: event.target.value })
          }
        >
          <option value="">{t("payments.all")}</option>
          {months.map((item) => (
            <option key={item} value={item}>
              {periodLabel(item)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
