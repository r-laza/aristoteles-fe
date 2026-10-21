import { AppLayout } from "../components/layout/AppLayout";
import { ReusableGroups } from "../features/cycles/ReusableGroups";
import { t } from "../lib/i18n";

export function GroupsPage() {
  return (
    <AppLayout>
      <div className="py-5">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-sky-950">
            {t("groups.title")}
          </h1>
          <p className="mt-2 text-slate-500">{t("groups.subtitle")}</p>
        </div>
        <ReusableGroups showHeader={false} />
      </div>
    </AppLayout>
  );
}
