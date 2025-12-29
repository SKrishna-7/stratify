"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. GET BOARD DATA
export async function getBoardData() {
  try {
    // Fetch columns with their tasks
    let columns = await db.taskColumn.findMany({
      include: {
        tasks: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });

    // If no columns exist (first run), create default ones
    if (columns.length === 0) {
      await db.taskColumn.createMany({
        data: [
          { title: "Todo", order: 0 },
          { title: "In Progress", order: 1 },
          { title: "Done", order: 2 }
        ]
      });
      // Re-fetch
      columns = await db.taskColumn.findMany({
        include: { tasks: true },
        orderBy: { order: 'asc' }
      });
    }

    return columns;
  } catch (error) {
    return [];
  }
}

// 2. CREATE TASK
// Update the function signature to accept priority
export async function createTaskAction(content: string, columnId: string, priority: string = "medium") {
  const count = await db.task.count({ where: { columnId } });
  
  await db.task.create({
    data: {
      content,
      columnId,
      order: count,
      priority // <--- Now uses the passed value
    }
  });
  revalidatePath("/tasks");
}

// 3. MOVE TASK (Simple update for now)
export async function moveTaskAction(taskId: string, newColumnId: string) {
  await db.task.update({
    where: { id: taskId },
    data: { columnId: newColumnId }
  });
  revalidatePath("/tasks");
}

// 4. DELETE TASK
export async function deleteTaskAction(taskId: string) {
  await db.task.delete({ where: { id: taskId } });
  revalidatePath("/tasks");
}

// 5. UPDATE PRIORITY
export async function updatePriorityAction(taskId: string, priority: string) {
  await db.task.update({
    where: { id: taskId },
    data: { priority }
  });
  revalidatePath("/tasks");
}