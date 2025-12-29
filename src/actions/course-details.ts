"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- FETCH DATA ---
export async function getCourseDetails(courseId: string) {
  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            topics: { orderBy: { id: 'asc' } } // Order topics by creation (using ID as proxy)
          },
          orderBy: { id: 'asc' }
        }
      }
    });

    // Fetch Planner Events (Global for now, or filter by course if schema supported it)
    // We will just fetch all events for the user to keep it simple
    const events = await db.event.findMany({
      orderBy: { startTime: 'asc' }
    });

    return { course, events };
  } catch (error) {
    return { course: null, events: [] };
  }
}

// --- MODULE ACTIONS ---
export async function createModuleAction(courseId: string, title: string) {
  await db.module.create({
    data: { title, courseId, status: 'pending' }
  });
  revalidatePath(`/courses/${courseId}`);
}

export async function updateModuleStatusAction(moduleId: string, status: string, courseId: string) {
  await db.module.update({
    where: { id: moduleId },
    data: { status }
  });
  revalidatePath(`/courses/${courseId}`);
}

export async function deleteModuleAction(moduleId: string, courseId: string) {
  await db.module.delete({ where: { id: moduleId } });
  revalidatePath(`/courses/${courseId}`);
}

export async function renameModuleAction(moduleId: string, title: string, courseId: string) {
  await db.module.update({
    where: { id: moduleId },
    data: { title }
  });
  revalidatePath(`/courses/${courseId}`);
}

// --- TOPIC ACTIONS ---
export async function createTopicAction(moduleId: string, title: string, courseId: string) {
  await db.topic.create({
    data: { title, moduleId, duration: "15 min" }
  });
  revalidatePath(`/courses/${courseId}`);
}

export async function toggleTopicCompletionAction(topicId: string, isCompleted: boolean, courseId: string) {
  await db.topic.update({
    where: { id: topicId },
    data: { isCompleted }
  });
  revalidatePath(`/courses/${courseId}`);
}

export async function toggleTopicFocusAction(topicId: string, isFocus: boolean, courseId: string) {
  await db.topic.update({
    where: { id: topicId },
    data: { isFocus }
  });
  revalidatePath(`/courses/${courseId}`);
}

export async function deleteTopicAction(topicId: string, courseId: string) {
  await db.topic.delete({ where: { id: topicId } });
  revalidatePath(`/courses/${courseId}`);
}

// --- PLANNER ACTIONS ---
export async function createEventAction(data: any, courseId: string) {
  await db.event.create({
    data: {
      title: data.title,
      subtitle: data.subtitle,
      startTime: data.startTime,
      date: data.date,
      type: data.type,
      isDone: false
    }
  });
  revalidatePath(`/courses/${courseId}`);
}

export async function deleteEventAction(eventId: string, courseId: string) {
  await db.event.delete({ where: { id: eventId } });
  revalidatePath(`/courses/${courseId}`);
}

export async function toggleEventAction(eventId: string, isDone: boolean, courseId: string) {
  await db.event.update({ where: { id: eventId }, data: { isDone } });
  revalidatePath(`/courses/${courseId}`);
}