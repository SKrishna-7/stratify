"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. GET TOPIC DATA
export async function getTopicDetails(topicId: string) {
  try {
    const topic = await db.topic.findUnique({
      where: { id: topicId },
      include: {
        module: {
          include: {
            course: true // To show Course Title in header
          }
        }
      }
    });
    return topic;
  } catch (error) {
    return null;
  }
}

// 2. SAVE NOTE (Auto-saved)
export async function saveNoteAction(topicId: string, content: string) {
  await db.topic.update({
    where: { id: topicId },
    data: { note: content }
  });
  // No revalidatePath needed here as it's a background save
}

// 3. SAVE RESOURCE
export async function saveResourceAction(topicId: string, url: string, mode: string) {
  await db.topic.update({
    where: { id: topicId },
    data: { 
      resourceUrl: url,
      resourceMode: mode
    }
  });
  revalidatePath(`/learn/${topicId}`);
}

// 4. MARK COMPLETE
export async function completeTopicAction(topicId: string) {
  await db.topic.update({
    where: { id: topicId },
    data: { isCompleted: true }
  });
  revalidatePath(`/courses`); // Refresh main lists
}