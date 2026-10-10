import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  PlayCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { t } from "../lib/i18n";

const lessons = [
  {
    title: t("courseDemo.lessons.introduction.title"),
    description: t("courseDemo.lessons.introduction.description"),
    status: t("courseDemo.lessonStatus.current"),
    Icon: PlayCircle,
  },
  {
    title: t("courseDemo.lessons.practice.title"),
    description: t("courseDemo.lessons.practice.description"),
    status: t("courseDemo.lessonStatus.next"),
    Icon: BookOpen,
  },
  {
    title: t("courseDemo.lessons.review.title"),
    description: t("courseDemo.lessons.review.description"),
    status: t("courseDemo.lessonStatus.pending"),
    Icon: CheckCircle2,
  },
];

export function MathematicsCoursePage() {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-6xl py-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 transition hover:text-sky-900"
        >
          <ChevronLeft size={18} aria-hidden="true" />
          {t("courseDemo.backToDashboard")}
        </Link>

        <header className="mt-5 rounded-2xl bg-gradient-to-r from-sky-950 to-sky-800 p-6 text-white shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-200">
            {t("courseDemo.courseLabel")}
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            {t("courseDemo.title")}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-sky-100 sm:text-base">
            {t("courseDemo.description")}
          </p>
        </header>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <div className="aspect-video overflow-hidden rounded-xl bg-slate-950">
            <iframe
              className="h-full w-full"
              src="https://www.youtube-nocookie.com/embed/vMSrAcrH9tg?list=PLTIdiuUvwYCHrjyEIYR8ZOhza5NAFef3Y"
              title={t("courseDemo.videoTitle")}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-100 p-2 text-sky-800">
              <BookOpen size={22} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {t("courseDemo.contentTitle")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t("courseDemo.contentDescription")}
              </p>
            </div>
          </div>

          <ol className="mt-5 grid gap-3">
            {lessons.map(({ title, description, status, Icon }, index) => (
              <li
                key={title}
                className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-sky-800 shadow-sm">
                  <Icon size={19} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">
                      {t("courseDemo.lessonNumber", {
                        number: index + 1,
                        title,
                      })}
                    </h3>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-sky-700">
                      {status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {description}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock3 size={14} aria-hidden="true" />
                    {t("courseDemo.lessonDuration")}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </AppLayout>
  );
}
