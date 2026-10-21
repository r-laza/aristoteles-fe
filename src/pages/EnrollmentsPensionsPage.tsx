import { useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { ReusableFees } from "../features/cycles/ReusableFees";
import { ReusablePensions } from "../features/cycles/ReusablePensions";
import { t } from "../lib/i18n";

type CatalogTab = "enrollments" | "pensions";

export function EnrollmentsPensionsPage() {
  const [tab, setTab] = useState<CatalogTab>("enrollments");

  return (
    <AppLayout>
      <div className="py-5">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-sky-950">
            {t("enrollmentsPensions.title")}
          </h1>
          <p className="mt-2 text-slate-500">
            {t("enrollmentsPensions.subtitle")}
          </p>
        </div>
        <div
          className="mb-6 flex flex-wrap gap-2"
          role="tablist"
          aria-label={t("enrollmentsPensions.tabsLabel")}
        >
          {(["enrollments", "pensions"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`rounded-xl px-4 py-2 font-medium ${tab === value ? "bg-sky-50 text-sky-800" : "text-slate-500 hover:bg-slate-50"}`}
            >
              {t(`enrollmentsPensions.tabs.${value}`)}
            </button>
          ))}
        </div>
        {tab === "enrollments" ? <ReusableFees /> : <ReusablePensions />}
      </div>
    </AppLayout>
  );
}
