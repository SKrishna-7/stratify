// app/page.tsx
import DashboardContent from "./DashboardContent";
import { getDashboardStats } from "@actions/dashboard";
import { getApplications } from "@actions/application";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [stats, applications] = await Promise.all([
    getDashboardStats(),
    getApplications(),
  ]);

  // Safety guard: never pass null to client
  const safeStats = stats ?? {
    user: null,
    activityData: {},
    recentCourse: null,
    activeCourses: [],
    allCourses:[],
    goals: [],
    plannerEvents: [],  };

  return (
    <DashboardContent
      initialData={{
        ...safeStats,
        appCount: applications?.length ?? 0,
      }}
    />
  );
}
