import { useEffect, useState, type FormEvent } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { CycleModal } from "../features/cycles/CycleModal";
import { cycleApi, type Branch } from "../features/cycles/cycles";
import { t } from "../lib/i18n";

function BranchForm({ branch, onClose, onSaved }: { branch?: Branch; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const data = new FormData(event.currentTarget);
    try { await cycleApi.saveBranch({ name: String(data.get("name")).trim(), address: String(data.get("address")).trim() || null, details: String(data.get("details")).trim() || null, isActive: data.get("isActive") === "on" }, branch?.id); onSaved(); }
    catch { setError(t("branches.saveError")); } finally { setBusy(false); }
  }
  return <CycleModal title={t(branch ? "branches.edit" : "branches.create")} busy={busy} onClose={onClose}><form onSubmit={(event) => void submit(event)} className="space-y-4"><fieldset disabled={busy} className="space-y-4"><div><label className="field-label" htmlFor="branch-name">{t("branches.name")}</label><input id="branch-name" name="name" required maxLength={100} defaultValue={branch?.name} className="field" /></div><div><label className="field-label" htmlFor="branch-address">{t("branches.address")}</label><input id="branch-address" name="address" maxLength={250} defaultValue={branch?.address ?? ""} className="field" /></div><div><label className="field-label" htmlFor="branch-details">{t("branches.details")}</label><textarea id="branch-details" name="details" maxLength={500} defaultValue={branch?.details ?? ""} className="field" /></div><label className="flex items-center gap-2"><input name="isActive" type="checkbox" defaultChecked={branch?.isActive ?? true} />{t("branches.active")}</label></fieldset>{error && <p role="alert" className="text-red-700">{error}</p>}<div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border px-4 py-2">{t("admin.cancel")}</button><button className="primary-button">{t(busy ? "admin.saving" : "cycleDetail.save")}</button></div></form></CycleModal>;
}

export function BranchesPage() {
  const [rows, setRows] = useState<Branch[]>([]), [loading, setLoading] = useState(true), [editing, setEditing] = useState<Branch | null | undefined>(), [version, setVersion] = useState(0);
  useEffect(() => { setLoading(true); void cycleApi.branches().then(setRows).finally(() => setLoading(false)); }, [version]);
  return <AppLayout><div className="py-5"><div className="mb-8 flex items-end justify-between"><div><h1 className="text-3xl font-bold text-sky-950">{t("branches.title")}</h1><p className="mt-2 text-slate-500">{t("branches.subtitle")}</p></div><button className="primary-button" onClick={() => setEditing(null)}>{t("branches.create")}</button></div>{loading ? <p>{t("branches.loading")}</p> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map((branch) => <article key={branch.id} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex justify-between gap-3"><h2 className="text-lg font-semibold text-sky-950">{branch.name}</h2><button className="text-sm font-medium text-sky-700" onClick={() => setEditing(branch)}>{t("branches.edit")}</button></div><p className="mt-2 text-sm text-slate-500">{branch.address || t("branches.noAddress")}</p><p className="mt-4 text-sm">{t("branches.groupCount", { count: branch._count?.groups ?? 0 })}</p><span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${branch.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{t(branch.isActive ? "branches.active" : "branches.inactive")}</span></article>)}</div>}{editing !== undefined && <BranchForm branch={editing ?? undefined} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); setVersion((v) => v + 1); }} />}</div></AppLayout>;
}
