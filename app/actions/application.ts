"use server";

import { db } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server"; // Import Auth

export async function getApplications() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const apps = await db.jobApplication.findMany({
      where: { userId: userId }, // DATA ISOLATION
      orderBy: { dateApplied: 'asc' }
    });

    return apps;
  } catch (error) {
    console.error("GET_APPS_ERROR:", error);
    return [];
  }
}

export async function createApplicationAction(data: any) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await db.jobApplication.create({
      data: {
        company: data.company,
        position: data.position,
        status: "Applied", 
        salary: data.salary || "",
        location: data.location || "",
        userId: userId, // CRITICAL: Link to Clerk User
      }
    });

    revalidatePath("/applications");
    revalidatePath("/"); // Update dashboard stats too
    return { success: true };
  } catch (error) {
    console.error("CREATE_APP_ERROR:", error);
    return { success: false };
  }
}

export async function updateStatusAction(id: string, status: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await db.jobApplication.update({
      where: { 
        id: id,
        userId: userId // Security: Only update if user owns the record
      },
      data: { status }
    });

    revalidatePath("/applications");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function deleteApplicationAction(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Using deleteMany with userId is a safer pattern for server actions
    await db.jobApplication.deleteMany({ 
      where: { 
        id: id,
        userId: userId 
      } 
    });

    revalidatePath("/applications");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}