"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. GET ALL COURSES (With calculated progress)
export async function getCourses() {
  try {
    const courses = await db.course.findMany({
      include: {
        modules: {
          include: {
            topics: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform DB data to match your UI needs
    return courses.map(course => {
      // Calculate Stats
      let totalTopics = 0;
      let completedTopics = 0;

      course.modules.forEach(mod => {
        totalTopics += mod.topics.length;
        completedTopics += mod.topics.filter(t => t.isCompleted).length;
      });

      const progress = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);
      const totalModules = course.modules.length;
      const completedModules = course.modules.filter(m => m.status === 'completed').length;

      return {
        ...course,
        progress,
        totalModules,
        completedModules,
        lastAccessed: "Recently" // We can implement real tracking later
      };
    });
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return [];
  }
}

// 2. CREATE A COURSE
// ... keep getCourses ...

// UPDATE THIS FUNCTION
export async function createCourseAction(
  title: string, 
  description: string, 
  startDateStr: string, // Accept as string from frontend
  endDateStr: string    // Accept as string from frontend
) {
  try {
    // 1. Convert strings to Date objects (or null if empty)
    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;

    // 2. Create in DB
    await db.course.create({
      data: {
        title,
        description,
        startDate,
        endDate,
        
        // Default values for required fields (Adjust as needed for your app)
        progress: 0,
        totalModules: 0,
        completedModules: 0,
        color: "bg-blue-500", // Default color
        icon: "📚",           // Default icon
        // userId: "user_123" // If you have auth, get the userId here!
      },
    });

    // 3. Revalidate
    revalidatePath("/courses");
    return { success: true };

  } catch (error) {
    console.error("CREATE COURSE ERROR:", error);
    return { success: false };
  }
}