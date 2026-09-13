import { t } from '../../lib/i18n';

type RecentActivityItem = {
  id: number;
  title: string;
  course: string;
  createdAt: string;
};

type RecentActivityProps = {
  items: RecentActivityItem[];
};

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-800">{t('dashboard.recentActivity')}</h2>
      <ul className="mt-4 space-y-4">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
              •
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-700">{item.title}</p>
              <p className="text-sm text-slate-500">{item.course}</p>
              <p className="mt-1 text-xs text-slate-400">
                {new Date(item.createdAt).toLocaleDateString('es-PE', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
