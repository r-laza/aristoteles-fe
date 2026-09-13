type SummaryCardProps = {
  title: string;
  value: string;
  secondary: string;
  accent?: 'sky' | 'cyan' | 'indigo';
};

export function SummaryCard({ title, value, secondary, accent = 'sky' }: SummaryCardProps) {
  const accentClasses = {
    sky: 'bg-sky-50 text-sky-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    indigo: 'bg-indigo-50 text-indigo-700',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${accentClasses[accent]}`}>
          <div className="h-5 w-5 rounded-full bg-current opacity-70" />
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{secondary}</p>
    </div>
  );
}
