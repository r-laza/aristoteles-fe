export type AdminDashboardResponse = {
  activeCycle: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
  summary: {
    enrolledStudents: number;
    upToDateStudents: number;
    studentsWithDebt: number;
    totalCollected: string;
    outstandingBalance: string;
    enrollmentCollected: string;
    pensionCollected: string;
  };
  monthlyCollected: {
    period: string;
    enrollment: string;
    pension: string;
    total: string;
  }[];
};
