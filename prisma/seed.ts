import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const MY_CLERK_ID = "user_37c6LxPbztlVCNZhFmGCS1Kenhl";


  // 1. CLEANUP (Optional: Remove if you want to keep existing data)
  // We use deleteMany with the specific userId to only clear YOUR data
  await prisma.topic.deleteMany({ where: { module: { course: { userId: MY_CLERK_ID } } } });
  await prisma.module.deleteMany({ where: { course: { userId: MY_CLERK_ID } } });
  await prisma.course.deleteMany({ where: { userId: MY_CLERK_ID } });
  await prisma.goal.deleteMany({ where: { userId: MY_CLERK_ID } });
  await prisma.task.deleteMany({ where: { userId: MY_CLERK_ID } });

  // 2. ENSURE USER EXISTS
  const user = await prisma.user.upsert({
    where: { clerkId: MY_CLERK_ID },
    update: {},
    create: {
      clerkId: MY_CLERK_ID,
      email: "suresh@example.com", // Update with your actual email if desired
      name: "Suresh Krishnan S",
      plan: "PRO",
    },
  });

  // 3. SEED COURSE
  const reactCourse = await prisma.course.create({
    data: {
      userId: MY_CLERK_ID,
      title: "Advanced Next.js 15 & Prisma",
      description: "Mastering server actions, streaming, and multi-tenant database architecture.",
      icon: "Zap",
      color: "bg-emerald-500",
      modules: {
        create: [
          {
            title: "Database Security",
            status: "in-progress",
            topics: {
              create: [
                { title: "Row Level Isolation", isCompleted: true, duration: "20m" },
                { title: "Prisma Middleware", isCompleted: false, duration: "45m" },
              ],
            },
          },
        ],
      },
    },
  });

  // 4. SEED GOALS
  await prisma.goal.create({
    data: {
      userId: MY_CLERK_ID,
      title: "Complete SaaS Backbone",
      type: "monthly",
      category: "COURSE",
      targetId: reactCourse.id,
      target: 10,
      current: 3,
      deadline: new Date("2025-02-01"),
      color: "emerald",
    },
  });

  // 5. SEED KANBAN COLUMNS (Structure) & TASKS
  // We check if columns exist first to avoid unique constraint errors
  const todoCol = await prisma.taskColumn.findFirst({ where: { title: "Todo" } }) 
                 || await prisma.taskColumn.create({ data: { title: "Todo", order: 0 } });

  await prisma.task.create({
    data: {
      userId: MY_CLERK_ID,
      content: "Finalize Deployment to Vercel",
      priority: "high",
      columnId: todoCol.id,
      order: 0,
    },
  });

  console.log("✅ Seed Successful. System Online for User:", MY_CLERK_ID);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });