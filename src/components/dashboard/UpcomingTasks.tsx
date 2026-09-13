import { t } from '../../lib/i18n';

type UpcomingTask = {
  id: number;
  title: string;
  course: string;
  dueAt: string;
};

type UpcomingTasksProps = {
  items: UpcomingTask[];
};

export function UpcomingTasks({ items }: UpcomingTasksProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-800">{t('dashboard.upcomingTasks')}</h2>
      <ul className="mt-4 space-y-4">
        {items.map((task) => (
          <li key={task.id} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
            <div className="min-w-0">
              <p className="font-medium text-slate-800">{task.title}</p>
              <p className="text-sm text-slate-500">{task.course}</p>
              <p className="mt-1 text-xs text-slate-400">
                {new Date(task.dueAt).toLocaleDateString('es-PE', {
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
