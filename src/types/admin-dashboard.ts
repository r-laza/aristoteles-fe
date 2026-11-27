export type DashboardFilters = { branchId?: number; cycleId?: number; groupId?: number };
export type DashboardSummary = {
  activeCycle: { id: number; name: string; startDate: string; endDate: string };
  summary: { enrolledStudents: number; schoolEnrollments: number; preuniversityEnrollments: number; upToDateStudents: number; pendingStudents: number; overdueStudents: number; studentsWithDebt: number; totalCollected: string; outstandingBalance: string; overdueBalance: string; enrollmentCollected: string; pensionCollected: string };
  enrollmentDistribution: { school: { id: number; name: string; count: number }[]; preuniversity: { id: number; name: string; count: number }[] };
  enrollmentComparison: {
    branches: { id: number; name: string }[];
    rows: { groupId: number; groupName: string; counts: { branchId: number; count: number }[]; total: number }[];
  };
  paymentMethods: { method: "CASH" | "TRANSFER" | "YAPE" | "PLIN"; amount: string }[];
  unrepresentedCollected: string;
  monthlyCollected: { period: string; enrollment: string; pension: string; total: string }[];
};
export type AdminDashboardResponse = {
  branches: { id: number; name: string }[]; selectedBranchId: number | null;
  cycles: { id: number; name: string; status: "UPCOMING" | "ACTIVE" | "CLOSED" }[]; selectedCycleId: number | null;
  groups: { id: number; name: string }[]; selectedGroupId: number | null;
  dashboard: DashboardSummary | null;
};
export type DashboardStudentFinance = { enrollmentId: number; studentId: number; student: { id: number; fullName: string; dni: string }; group: string; totalPaid: string; outstandingBalance: string; status: "PAID" | "PARTIAL" | "PENDING" | "OVERDUE" };
export type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number; totalPages: number };
export type DebtorDetail = {
  enrollmentId: number;
  student: { fullName: string; dni: string; representativeName: string; relationship: "FATHER" | "MOTHER" | "OTHER"; relationshipOther: string | null; primaryPhone: string };
  branch: string; cycle: string; group: string; totalPaid: string; totalOwed: string; overdueBalance: string; asOfDate: string;
  installments: { paymentType: string; period: string | null; dueDate: string | null; amountDue: string; amountPaid: string; balance: string; overdue: boolean }[];
  payments: { id: number; date: string; amount: string; paymentType: string; period: string | null; method: string }[];
};
