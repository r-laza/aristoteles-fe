import { money, periodLabel } from "../../features/payments/formatting";
import { t } from "../../lib/i18n";
import type { AdminDashboardResponse } from "../../types/admin-dashboard";

type Monthly = AdminDashboardResponse["monthlyCollected"][number];

const amount = (value: string) => Math.round(Number(value) * 100);

export function MonthlyRevenueChart({ data }: { data: Monthly[] }) {
  const maximum = Math.max(0, ...data.map((row) => amount(row.total)));
  if (maximum === 0) return <ChartEmpty />;

  return (
    <div className="overflow-x-auto pb-2">
      <div
        className="grid h-64 items-end gap-3"
        style={{
          gridTemplateColumns: `repeat(${data.length}, minmax(52px, 1fr))`,
          minWidth: `max(100%, ${data.length * 68}px)`,
        }}
      >
        {data.map((row) => {
          const enrollment = amount(row.enrollment);
          const pension = amount(row.pension);
          const label = periodLabel(row.period);
          const tooltip = t("adminDashboard.monthTooltip", {
            month: label,
            total: money(row.total),
            enrollment: money(row.enrollment),
            pension: money(row.pension),
          });
          return (
            <div
              key={row.period}
              className="flex h-full min-w-0 flex-col justify-end"
            >
              <div className="mb-2 truncate text-center text-xs font-semibold text-slate-600">
                {money(row.total)}
              </div>
              <div
                className="group relative mx-auto flex w-full max-w-12 flex-col justify-end overflow-hidden rounded-t-lg bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                style={{
                  height: `${Math.max(4, (amount(row.total) / maximum) * 180)}px`,
                }}
                title={tooltip}
                aria-label={tooltip}
                tabIndex={0}
              >
                {pension > 0 && (
                  <div
                    className="w-full bg-cyan-400"
                    style={{
                      height: `${(pension / amount(row.total)) * 100}%`,
                    }}
                  />
                )}
                {enrollment > 0 && (
                  <div
                    className="w-full bg-sky-800"
                    style={{
                      height: `${(enrollment / amount(row.total)) * 100}%`,
                    }}
                  />
                )}
              </div>
              <div className="mt-2 truncate text-center text-xs capitalize text-slate-500">
                {label.replace(/ de /, " ")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type DonutItem = {
  label: string;
  value: number;
  displayValue?: string;
  color: string;
};

export function DonutChart({
  items,
  centerLabel,
  centerValue,
}: {
  items: DonutItem[];
  centerLabel: string;
  centerValue: string;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <ChartEmpty />;
  const segments = items.reduce<{ cursor: number; values: string[] }>(
    (result, item) => {
      const end = result.cursor + (item.value / total) * 100;
      return {
        cursor: end,
        values: [...result.values, `${item.color} ${result.cursor}% ${end}%`],
      };
    },
    { cursor: 0, values: [] },
  ).values;
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[160px_minmax(0,1fr)]">
      <div
        className="relative mx-auto h-40 w-40 rounded-full"
        style={{ background: `conic-gradient(${segments.join(", ")})` }}
        role="img"
        aria-label={items
          .map((item) =>
            t("adminDashboard.segmentTooltip", {
              label: item.label,
              value: item.displayValue ?? item.value,
            }),
          )
          .join(", ")}
      >
        <div className="absolute inset-7 grid place-content-center rounded-full bg-white text-center">
          <strong className="text-xl text-sky-950">{centerValue}</strong>
          <span className="text-xs text-slate-500">{centerLabel}</span>
        </div>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between gap-3 text-sm"
            title={t("adminDashboard.segmentTooltip", {
              label: item.label,
              value: item.displayValue ?? item.value,
            })}
          >
            <span className="flex min-w-0 items-center gap-2 text-slate-600">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate">{item.label}</span>
            </span>
            <strong className="text-slate-800">
              {item.displayValue ?? item.value}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-sky-800" />
        {t("adminDashboard.enrollments")}
      </span>
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
        {t("adminDashboard.pensions")}
      </span>
    </div>
  );
}

function ChartEmpty() {
  return (
    <div className="grid min-h-44 place-items-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-500">
      {t("adminDashboard.noData")}
    </div>
  );
}
