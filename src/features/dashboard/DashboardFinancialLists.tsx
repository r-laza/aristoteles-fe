import { FileSpreadsheet, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { t } from "../../lib/i18n";
import { downloadDashboardDebtors, fetchDashboardDebtor, fetchDashboardDebtors, fetchDashboardPayments, fetchDashboardPending } from "../../services/dashboard.api";
import type { DashboardFilters, DashboardStudentFinance, DebtorDetail, Paginated } from "../../types/admin-dashboard";
import { CycleModal } from "../cycles/CycleModal";
import { money } from "../payments/formatting";
import { PaymentStatusBadge } from "../payments/PaymentStatusBadge";

type View = "upToDateTab" | "pending" | "debtors";
const tabs: View[] = ["debtors", "pending", "upToDateTab"];
const emptyPage = (): Paginated<DashboardStudentFinance> => ({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 });

export function DashboardFinancialLists({ filters }: { filters: DashboardFilters }) {
  const [view, setView] = useState<View>("debtors");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(emptyPage);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [detailRow, setDetailRow] = useState<DashboardStudentFinance | null>(null);
  const [detail, setDetail] = useState<DebtorDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  useEffect(() => setPage(1), [filters.branchId, filters.cycleId, filters.groupId, search, view]);
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true); setLoadError(false);
      const fetcher = view === "upToDateTab" ? fetchDashboardPayments : view === "pending" ? fetchDashboardPending : fetchDashboardDebtors;
      fetcher(filters, page, search).then((value) => { if (!cancelled) setResult(value); }).catch(() => { if (!cancelled) setLoadError(true); }).finally(() => { if (!cancelled) setLoading(false); });
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [filters, page, search, view]);
  const showDetail = (row: DashboardStudentFinance) => {
    setDetailRow(row); setDetail(null); setDetailLoading(true);
    fetchDashboardDebtor(row.enrollmentId, filters).then(setDetail).finally(() => setDetailLoading(false));
  };
  const exportExcel = async () => { setExporting(true); try { const file = await downloadDashboardDebtors(filters, search); const url = URL.createObjectURL(file.blob); const link = document.createElement("a"); link.href = url; link.download = file.filename; link.click(); URL.revokeObjectURL(url); } finally { setExporting(false); } };
  return <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-4 border-b bg-slate-50/60 p-4 sm:p-5"><div className="grid grid-cols-1 rounded-xl border bg-slate-100 p-1 sm:grid-cols-3" role="tablist" aria-label={t("adminDashboard.financialViews")}>{tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={view === tab} onClick={() => setView(tab)} className={`min-h-11 rounded-lg px-4 text-sm font-semibold ${view === tab ? tab === "debtors" ? "bg-red-700 text-white" : tab === "pending" ? "bg-amber-400 text-amber-950" : "bg-emerald-700 text-white" : "text-slate-600 hover:bg-white"}`}>{t(`adminDashboard.${tab}`)}</button>)}</div><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><label className="relative block w-full sm:max-w-sm"><span className="sr-only">{t("adminDashboard.search")}</span><Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input className="field bg-white pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("adminDashboard.searchStudents")} /></label>{view === "debtors" && <button type="button" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-emerald-400 disabled:opacity-70 sm:w-auto" disabled={exporting} aria-busy={exporting} onClick={() => void exportExcel()}><FileSpreadsheet size={18} aria-hidden="true" />{t(exporting ? "adminDashboard.exporting" : "adminDashboard.downloadExcel")}</button>}</div></div><div className="p-4 sm:p-5">{loading ? <p className="py-10 text-center text-slate-500" role="status">{t("adminDashboard.loading")}</p> : loadError ? <p className="py-10 text-center text-red-700" role="alert">{t("adminDashboard.listError")}</p> : <StudentFinanceList items={result.items} view={view} onDetail={showDetail} />}{!loading && result.totalPages > 1 && <div className="mt-5 flex items-center justify-between gap-3"><button className="secondary-button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>{t("adminDashboard.previous")}</button><span className="text-sm text-slate-600">{t("adminDashboard.pageOf", { page, total: result.totalPages })}</span><button className="secondary-button" disabled={page >= result.totalPages} onClick={() => setPage((value) => value + 1)}>{t("adminDashboard.next")}</button></div>}</div>{detailRow && <CompactFinancialDetail row={detailRow} detail={detail} loading={detailLoading} onClose={() => { setDetailRow(null); setDetail(null); }} />}</section>;
}

function StudentFinanceList({ items, view, onDetail }: { items: DashboardStudentFinance[]; view: View; onDetail: (row: DashboardStudentFinance) => void }) {
  if (!items.length) return <p className="py-10 text-center text-slate-500">{t(view === "upToDateTab" ? "adminDashboard.noUpToDate" : view === "pending" ? "adminDashboard.noPending" : "adminDashboard.noDebtors")}</p>;
  return <><div className="grid gap-3 md:hidden">{items.map((item) => <article key={item.studentId} className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-sky-950">{item.student.fullName}</p><p className="text-xs text-slate-500">DNI {item.student.dni} · {item.group}</p></div><PaymentStatusBadge status={item.status} account prominent /></div><dl className="mt-4 grid grid-cols-2 gap-3"><Amount label={t("adminDashboard.totalPaid")} value={item.totalPaid} /><Amount label={t("adminDashboard.outstandingBalance")} value={item.outstandingBalance} /></dl><button className="secondary-button mt-4 w-full" onClick={() => onDetail(item)}>{t("adminDashboard.viewDetail")}</button></article>)}</div><div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block"><table className="w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr>{["student", "group", "totalPaid", "outstandingBalance", "status", "action"].map((key) => <th key={key} className="px-5 py-3.5">{t(`adminDashboard.${key}`)}</th>)}</tr></thead><tbody className="divide-y">{items.map((item) => <tr key={item.studentId} className="hover:bg-sky-50/50"><td className="px-5 py-4"><strong>{item.student.fullName}</strong><p className="text-xs text-slate-500">DNI {item.student.dni}</p></td><td className="px-5 py-4">{item.group}</td><td className="px-5 py-4 font-bold">{money(item.totalPaid)}</td><td className="px-5 py-4 font-bold">{money(item.outstandingBalance)}</td><td className="px-5 py-4"><PaymentStatusBadge status={item.status} account prominent /></td><td className="px-5 py-4"><button className="secondary-button" onClick={() => onDetail(item)}>{t("adminDashboard.viewDetail")}</button></td></tr>)}</tbody></table></div></>;
}
function Amount({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs uppercase text-slate-400">{label}</dt><dd className="mt-1 font-bold text-sky-950">{money(value)}</dd></div>; }

function CompactFinancialDetail({ row, detail, loading, onClose }: { row: DashboardStudentFinance; detail: DebtorDetail | null; loading: boolean; onClose: () => void }) {
  const nextDue = detail?.installments.filter((item) => Number(item.balance) > 0 && item.dueDate).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))[0]?.dueDate;
  return <CycleModal title={t("adminDashboard.studentFinancialDetail")} busy={false} onClose={onClose}><div className="space-y-5"><header className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4"><div><h3 className="font-bold text-sky-950">{row.student.fullName}</h3><p className="mt-1 text-sm text-slate-500">DNI {row.student.dni} · {row.group}</p></div><PaymentStatusBadge status={row.status} account prominent /></header>{loading ? <p role="status" className="py-6 text-center text-sm text-slate-500">{t("adminDashboard.loading")}</p> : <><dl className="grid grid-cols-2 gap-3"><Metric label={t("adminDashboard.totalPaid")} value={detail?.totalPaid ?? row.totalPaid} /><Metric label={t("adminDashboard.outstandingBalance")} value={detail?.totalOwed ?? row.outstandingBalance} /><Metric label={t("adminDashboard.overdueBalance")} value={detail?.overdueBalance ?? "0"} /><div className="rounded-xl border border-slate-200 p-3"><dt className="text-xs font-medium text-slate-500">{t("adminDashboard.nextDueDate")}</dt><dd className="mt-1 text-sm font-semibold text-sky-950">{nextDue ? spanishDate(nextDue) : t("adminDashboard.noNextDueDate")}</dd></div></dl></>}</div></CycleModal>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-200 p-3"><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="mt-1 text-lg font-bold text-sky-950 tabular-nums">{money(value)}</dd></div>; }
function spanishDate(value: string) { return new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }
