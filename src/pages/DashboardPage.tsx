import { useAuth } from '../auth/useAuth';
import { useEffect, useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';

import { AppLayout } from '../components/layout/AppLayout';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { CourseCard } from '../components/dashboard/CourseCard';
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks';
import { RecentActivity } from '../components/dashboard/RecentActivity';

import { fetchDashboard } from '../services/dashboard.api';
import type { DashboardResponse } from '../types/dashboard';
import { t } from '../lib/i18n';

export function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] =
    useState<DashboardResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchDashboard();
      setDashboard(data);
    } catch {
      setError(t('dashboard.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const bannerImage = '/images/banner-aristoteles.png';

  const summaryCards = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return [
      {
        title: t('dashboard.activeCourses'),
        value: String(dashboard.summary.activeCourses),
        secondary: t('dashboard.currentPeriod'),
        accent: 'sky' as const,
      },
      {
        title: t('dashboard.pendingTasks'),
        value: String(dashboard.summary.pendingTasks),
        secondary: t('dashboard.toReview'),
        accent: 'cyan' as const,
      },
      {
        title: t('dashboard.nextClass'),
        value: dashboard.summary.nextClass.course,
        secondary: new Date(
          dashboard.summary.nextClass.startsAt,
        ).toLocaleString('es-PE', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        accent: 'indigo' as const,
      },
    ];
  }, [dashboard]);

  if (loading) {
    return (
        <AppLayout>
            <div className="flex min-h-[60vh] items-center justify-center">
            <div className="rounded-2xl bg-white px-6 py-4 shadow-sm">
                {t('dashboard.loading')}
            </div>
            </div>
        </AppLayout>
        );
    }

    if (error || !dashboard) {
        return (
        <AppLayout>
            <div className="flex min-h-[60vh] items-center justify-center">
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
                <p className="font-medium text-slate-800">
                {error ?? t('dashboard.error')}
                </p>

                <button
                type="button"
                onClick={() => void loadDashboard()}
                className="mt-4 rounded-xl bg-sky-950 px-4 py-2 text-sm font-medium text-white"
                >
                {t('dashboard.retry')}
                </button>
            </div>
            </div>
        </AppLayout>
        );
    }
    return (
        <AppLayout
            studentName={dashboard.student.name}
            initials={dashboard.student.initials}
            banner={{ src: bannerImage, alt: t('dashboard.bannerAlt') }}
        >
            <div className="w-full">
            {/* Main dashboard layout */}
            <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
                {/* LEFT COLUMN */}
                <div className="min-w-0">
                {/* Welcome */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {t('dashboard.hello', {
                        name: (user?.fullName ?? dashboard.student.name).split(' ')[0],
                        })}
                    </h1>

                    <p className="mt-2 text-slate-500">
                        {t('dashboard.welcome')}
                    </p>
                    </div>

                    <button
                    type="button"
                    className="hidden items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm md:inline-flex"
                    >
                    <CalendarClock size={16} />
                    {t('dashboard.viewAll')}
                    </button>
                </div>

                {/* Summary cards */}
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    {summaryCards.map((card) => (
                    <SummaryCard
                        key={card.title}
                        title={card.title}
                        value={card.value}
                        secondary={card.secondary}
                        accent={card.accent}
                    />
                    ))}
                </div>

                {/* Courses */}
                <div className="mt-10">
                    <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-slate-900">
                        {t('dashboard.myCourses')}
                    </h2>

                    <button
                        type="button"
                        className="text-sm font-medium text-sky-700"
                    >
                        {t('dashboard.viewAll')}
                    </button>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                    {dashboard.courses.map((course) => (
                        <CourseCard
                        key={course.id}
                        name={course.name}
                        teacher={course.teacher}
                        progress={course.progress}
                        image={course.image}
                        />
                    ))}
                    </div>
                </div>
                </div>

                {/* RIGHT COLUMN */}
                <aside className="grid gap-5">
                <UpcomingTasks items={dashboard.upcomingTasks} />

                <RecentActivity items={dashboard.recentActivity} />
                </aside>
            </section>
            </div>
        </AppLayout>
    );
}
