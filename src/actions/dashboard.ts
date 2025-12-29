"use server";

import { db } from "@/lib/prisma";

export async function getDashboardStats() {
  try {
    const user = { name: "Suresh", streak: 12 };

    // 1. Fetch Courses
    const activeCoursesData = await db.course.findMany({
      include: { modules: { include: { topics: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 4 // Fetch top 4 for goals
    });

    // 2. Calculate Module Stats for Goals
    const activeCourses = activeCoursesData.map(course => {
      // Module Stats
      const totalModules = course.modules.length;
      const completedModules = course.modules.filter(m => m.status === 'completed').length;
      
      // Topic Stats (for general progress bar)
      const allTopics = course.modules.flatMap(m => m.topics);
      const completedTopics = allTopics.filter(t => t.isCompleted).length;
      const progress = allTopics.length > 0 ? Math.round((completedTopics / allTopics.length) * 100) : 0;

      return { 
        ...course, 
        progress,
        totalModules,
        completedModules
      };
    });

    const recentCourse = activeCourses[0] || null;

    // 3. Daily Tasks
    const dailyTasks = await db.task.findMany({
      where: {
        column: { title: { in: ["Todo", "In Progress"] } }
      },
      orderBy: { order: 'asc' },
      take: 5
    });

    return {
      user,
      recentCourse,
      activeCourses,
      dailyTasks
    };
  } catch (error) {
    return null;
  }
}