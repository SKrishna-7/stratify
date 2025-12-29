"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getGoals() {
  try {
    return await db.goal.findMany({ orderBy: { createdAt: 'desc' } });
  } catch (error) {
    return [];
  }
}

export async function createGoalAction(title: string, target: number, type: string) {
  await db.goal.create({
    data: {
      title,
      target,
      type,
      current: 0
    }
  });
  revalidatePath("/");
}

export async function updateGoalProgressAction(id: string, newCurrent: number) {
  // Check if we hit the target
  const goal = await db.goal.findUnique({ where: { id } });
  if (!goal) return;

  const isDone = newCurrent >= goal.target;

  await db.goal.update({
    where: { id },
    data: { 
      current: newCurrent,
      isDone
    }
  });
  revalidatePath("/");
}

export async function deleteGoalAction(id: string) {
  await db.goal.delete({ where: { id } });
  revalidatePath("/");
}