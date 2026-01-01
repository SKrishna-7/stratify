"use server";

import { db } from "../../lib/prisma"; // Ensure your path to db is correct
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { trackActivity } from "./activity-logger";

// 1. GET ALL COURSES (Filtered by User)
export async function getCourses() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const courses = await db.course.findMany({
      where: { userId: userId }, // CRITICAL: Only get your own data
      include: {
        modules: {
          include: { topics: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return courses.map(course => {
      let totalTopics = 0;
      let completedTopics = 0;

      course.modules.forEach(mod => {
        totalTopics += mod.topics.length;
        completedTopics += mod.topics.filter(t => t.isCompleted).length;
      });

      const progress = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);
      
      return {
  ...course,
  progress,
  totalModules: course.modules.length,
  completedModules: course.modules.filter(m => m.status === "completed").length,
  startDate: course.startDate ?? undefined,
  endDate: course.endDate ?? undefined,
};

    });
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return [];
  }
}

// 2. CREATE A COURSE (Linked to User)
export async function createCourseAction(
  title: string, 
  description: string, 
  startDateStr?: string | null, 
  endDateStr?: string | null
) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    // Convert string dates to Date objects if they exist
    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;

    await db.course.create({
      data: {
        title,
        description: description || "",
        startDate,
        endDate,
        userId: userId, // Maps to clerkId in your User model
        progress: 0,
        totalModules: 0,
        completedModules: 0,
        color: "bg-blue-400", 
        icon: "📚",
      },
    });

    // Revalidate to update the Dashboard and Course list
    revalidatePath("/");
    revalidatePath("/courses");
    
    return { success: true };
  } catch (error) {
    console.error("CREATE COURSE ERROR:", error);
    return { success: false };
  }
}
// 3. DELETE (With User check)
export async function deleteCourseAction(courseId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await db.course.delete({
      where: {
        id: courseId,
        userId: userId // CRITICAL: Prevent deleting other people's courses
      },
    });

    revalidatePath("/courses");
    return { success: true };
  } catch (error) {
    console.error("DELETE COURSE ERROR:", error);
    return { success: false };
  }
} 

// 4. UPDATE (With User check)
export async function updateCourseAction(
  courseId: string, 
  title: string, 
  description: string, 
  startDateStr: string, 
  endDateStr: string
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;

    await db.course.update({
      where: { 
        id: courseId,
        userId: userId // Security check
      },
      data: {
        title,
        description,
        startDate,
        endDate,
      },
    });

    revalidatePath("/courses");
    return { success: true };
  } catch (error) {
    console.error("UPDATE COURSE ERROR:", error);
    return { success: false };
  }
}


export async function completeTopic(topicId: string) {
  const { userId } = await auth();
  if (!userId) return;

  await db.topic.update({
    where: { id: topicId },
    data: {
      isCompleted: true,
      completedAt: new Date()
    }
  });

  // Activity tracking
  await trackActivity(userId);

  revalidatePath("/");
}

export async function toggleTopicCompletion(
  topicId: string,
  completed: boolean
) {
  const { userId } = await auth();
  if (!userId) return;

  await db.topic.update({
    where: { id: topicId },
    data: {
      isCompleted: completed,
      completedAt: completed ? new Date() : null,
    },
  });

  if (completed) {
    await trackActivity(userId);
  }

  revalidatePath("/");
}
