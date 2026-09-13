export type Student = {
  id: number;
  name: string;
  initials: string;
};

export type Summary = {
  activeCourses: number;
  pendingTasks: number;
  nextClass: {
    course: string;
    startsAt: string;
  };
};

export type Course = {
  id: number;
  name: string;
  teacher: string;
  progress: number;
  image: string;
};

export type UpcomingTask = {
  id: number;
  title: string;
  course: string;
  dueAt: string;
};

export type RecentActivity = {
  id: number;
  title: string;
  course: string;
  createdAt: string;
};

export type DashboardResponse = {
  student: Student;
  summary: Summary;
  courses: Course[];
  upcomingTasks: UpcomingTask[];
  recentActivity: RecentActivity[];
};
