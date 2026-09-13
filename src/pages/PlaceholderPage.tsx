import { AppLayout } from '../components/layout/AppLayout';
import { t } from '../lib/i18n';

type PlaceholderPageProps = {
  title?: string;
  description?: string;
};

export function PlaceholderPage({
  title = t('placeholders.title'),
  description = t('placeholders.description'),
}: PlaceholderPageProps) {
  return (
    <AppLayout studentName={t('student.defaultName')} initials={t('student.defaultInitials')}>
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-center shadow-sm sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">{t('app.virtualClassroom')}</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-4 text-base text-slate-600">{description}</p>
        </div>
      </div>
    </AppLayout>
  );
}
