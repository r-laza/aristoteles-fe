import { t } from '../../lib/i18n';

type CourseCardProps = {
  name: string;
  teacher: string;
  progress: number;
  image: string;
};

export function CourseCard({ name, teacher, progress, image }: CourseCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-36 overflow-hidden bg-slate-200">
        <img src={image} alt={name} className="h-full w-full object-cover" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{name}</h3>
            <p className="mt-1 text-sm text-slate-500">{teacher}</p>
          </div>
          <span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">
            {progress}%
          </span>
        </div>

        <div className="mt-4 h-2.5 rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-600 to-cyan-400" style={{ width: `${progress}%` }} />
        </div>

        <button
          type="button"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-sky-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-900"
        >
          {t('dashboard.enter')}
        </button>
      </div>
    </article>
  );
}
