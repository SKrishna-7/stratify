"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getApplications() {
  try {
    const apps = await db.jobApplication.findMany({
      orderBy: { dateApplied: 'desc' }
    });
    return apps;
  } catch (error) {
    return [];
  }
}

export async function createApplicationAction(data: any) {
  await db.jobApplication.create({
    data: {
      company: data.company,
      position: data.position,
      status: "Applied", // Default status
      salary: data.salary || "",
      location: data.location || ""
    }
  });
  revalidatePath("/applications");
}

export async function updateStatusAction(id: string, status: string) {
  await db.jobApplication.update({
    where: { id },
    data: { status }
  });
  revalidatePath("/applications");
}

export async function deleteApplicationAction(id: string) {
  await db.jobApplication.delete({ where: { id } });
  revalidatePath("/applications");
}