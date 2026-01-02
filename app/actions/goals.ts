"use server";

import { db } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

// 1. CREATE GOAL (Verified & Linked)
export async function createStrategicGoal(data: {
  title: string;
  type: 'weekly' | 'monthly';
  category: 'COURSE' | 'MODULE' | 'CUSTOM';
  targetId: string;
  deadline: Date;
  color: string;
}) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized: Please sign in again." };
    };

    let finalTarget = 1;

    // Verify the target object (Course or Module) actually belongs to this user
    if (data.category === 'MODULE') {
      const moduleData = await db.module.findFirst({
        where: { id: data.targetId, course: { userId: userId } },
        include: { topics: true }
      });
      if (!moduleData) throw new Error("Module not found or unauthorized");
      finalTarget = moduleData.topics.length || 1;
    } else if (data.category === 'COURSE') {
      const courseData = await db.course.findFirst({
        where: { id: data.targetId, userId: userId },
        include: { modules: { include: { topics: true } } }
      });
      if (!courseData) throw new Error("Course not found or unauthorized");
      finalTarget = courseData.modules.reduce((acc, mod) => acc + mod.topics.length, 0) || 1;
    }

    await db.goal.create({
      data: {
        title: data.title,
        type: data.type,
        category: data.category,
        targetId: data.targetId,
        deadline: data.deadline,
        target: finalTarget,
        color: data.color,
        userId: userId, // CRITICAL: Binding to current session
      }
    });
    
    revalidatePath("/");
    return { success: true };
  } catch(error){
    console.error("CREATE_GOAL_ERROR:", error);
    return { success: false };
  }
}

// 2. UPDATE PROGRESS (Owner-Locked)
export async function updateGoalProgress(id: string, newCurrent: number) {
  try {
    const { userId } = await auth();
    if (!userId) return;

    // findFirst ensures the user owns this specific goal record
    const goal = await db.goal.findFirst({ 
      where: { id, userId } 
    });

    if (!goal) return;

    const isDone = newCurrent >= goal.target;

    await db.goal.update({
      where: { id },
      data: { 
        current: Math.min(newCurrent, goal.target),
        isDone: isDone 
      }
    });
    revalidatePath("/");
  } catch (error) {
    console.error("UPDATE_GOAL_ERROR:", error);
  }
}

// 3. DELETE GOAL (Owner-Locked)
export async function deleteGoalAction(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) return;

    // deleteMany is used here as a security measure to ensure 
    // nothing is deleted unless ID and userId match.
    await db.goal.deleteMany({ 
      where: { id, userId } 
    });
    revalidatePath("/");
  } catch (error) {
    console.error("DELETE_GOAL_ERROR:", error);
  }
}

// 4. SYNC LOGIC (Data Integrity & Isolation)
export async function syncGoalWithCourse(courseId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return;

    // Find all goals tracking this course or its modules for THIS user
    const courseModules = await db.module.findMany({
      where: { courseId, course: { userId } },
      select: { id: true }
    });
    const moduleIds = courseModules.map(m => m.id);

    const allAffectedGoals = await db.goal.findMany({
      where: {
        userId,
        OR: [
          { targetId: courseId, category: 'COURSE' },
          { targetId: { in: moduleIds }, category: 'MODULE' }
        ]
      }
    });

    if (allAffectedGoals.length === 0) return;

    for (const goal of allAffectedGoals) {
      let completedCount = 0;

      if (goal.category === 'MODULE') {
        const mod = await db.module.findFirst({
          where: { id: goal.targetId!, course: { userId } },
          include: { topics: { where: { isCompleted: true } } }
        });
        completedCount = mod?.topics.length || 0;
      } else {
        const course = await db.course.findFirst({
          where: { id: courseId, userId },
          include: { modules: { include: { topics: { where: { isCompleted: true } } } } }
        });
        course?.modules.forEach(m => { completedCount += m.topics.length; });
      }

      await db.goal.update({
        where: { id: goal.id },
        data: {
          current: completedCount,
          isDone: completedCount >= goal.target
        }
      });
    }
    revalidatePath("/");
  } catch (error) {
    console.error("GOAL_SYNC_ERROR:", error);
  }
}


export async function toggleGoalAction(goalId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Get current state
  const goal = await db.goal.findFirst({
    where: { id: goalId, userId },
    select: { isDone: true }
  });

  if (!goal) throw new Error("Goal not found");

  // Toggle
  await db.goal.update({
    where: { id: goalId },
    data: { isDone: !goal.isDone }
  });

  return { success: true };
}

export async function getGoalById(goalId: string) {
  const { userId } = await auth();
  if (!userId) return null;

  const goal = await db.goal.findFirst({
    where: {
      id: goalId,
      userId
    }
  });

  if (!goal) return null;

  let target = null;

  if (goal.category === "COURSE") {
    target = await db.course.findFirst({
      where: { id: goal.targetId ?? undefined, userId },
      include: {
        modules: {
          include: { topics: true }
        }
      }
    });
  }

  if (goal.category === "MODULE") {
    target = await db.module.findFirst({
      where: { id: goal.targetId ?? undefined },
      include: { topics: true }
    });
  }

  return { goal, target };
}
