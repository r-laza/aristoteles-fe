import { money, periodLabel } from "../../features/payments/formatting";
import { t } from "../../lib/i18n";
import type { DashboardSummary } from "../../types/admin-dashboard";

type Monthly = DashboardSummary["monthlyCollected"][number];

const amount = (value: string) => Math.round(Number(value) * 100);

export function EnrollmentGroupChart({
  data,
  color = "#0369a1",
}: {
  data: DashboardSummary["enrollmentDistribution"]["school"];
  color?: string;
}) {
  const maximum = Math.max(0, ...data.map((group) => group.count));
  if (maximum === 0) return <ChartEmpty />;
  return (
    <ul className="space-y-5">
      {data.map((group) => {
        const tooltip = t("adminDashboard.groupEnrollmentTooltip", {
          group: group.name,
          count: group.count,
        });
        return (
          <li
            key={group.id}
            tabIndex={0}
            title={tooltip}
            aria-label={tooltip}
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <div className="mb-2 flex items-start justify-between gap-4 text-sm">
              <span className="min-w-0 break-words font-medium text-slate-600">
                {group.name}
              </span>
              <strong className="shrink-0 tabular-nums text-sky-950">
                {group.count}
              </strong>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-slate-100"
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(group.count / maximum) * 100}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

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
  percentageTotal,
}: {
  items: DonutItem[];
  centerLabel: string;
  centerValue: string;
  percentageTotal?: number;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <ChartEmpty />;
  const denominator = percentageTotal ?? total;
  const percent = (value: number) =>
    new Intl.NumberFormat("es-PE", {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(value / denominator);
  const tooltip = (item: DonutItem) =>
    t(
      percentageTotal === undefined
        ? "adminDashboard.segmentTooltip"
        : "adminDashboard.methodTooltip",
      {
        label: item.label,
        value: item.displayValue ?? item.value,
        percentage: percent(item.value),
      },
    );
  const segments = items.reduce<{ cursor: number; values: string[] }>(
    (result, item) => {
      const end = result.cursor + (item.value / denominator) * 100;
      return {
        cursor: end,
        values: [...result.values, `${item.color} ${result.cursor}% ${end}%`],
      };
    },
    { cursor: 0, values: [] },
  ).values;
  if (percentageTotal !== undefined && total < percentageTotal)
    segments.push(`#e2e8f0 ${(total / percentageTotal) * 100}% 100%`);
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[160px_minmax(0,1fr)]">
      <div
        className="relative mx-auto h-40 w-40 rounded-full"
        style={{ background: `conic-gradient(${segments.join(", ")})` }}
        role="img"
        aria-label={items.map(tooltip).join(", ")}
      >
        <div className="absolute inset-7 grid place-content-center rounded-full bg-white text-center">
          <strong
            className={
              percentageTotal === undefined
                ? "text-xl text-sky-950"
                : "break-words px-1 text-sm text-sky-950"
            }
          >
            {centerValue}
          </strong>
          <span className="text-xs text-slate-500">{centerLabel}</span>
        </div>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between gap-3 text-sm"
            title={tooltip(item)}
            tabIndex={percentageTotal === undefined ? undefined : 0}
            aria-label={
              percentageTotal === undefined ? undefined : tooltip(item)
            }
          >
            <span className="flex min-w-0 items-center gap-2 text-slate-600">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 text-right">
              <strong className="text-slate-800">
                {item.displayValue ?? item.value}
              </strong>
              {percentageTotal !== undefined && (
                <span className="mt-0.5 block text-xs tabular-nums text-slate-500">
                  {percent(item.value)}
                </span>
              )}
            </span>
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
