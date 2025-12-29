import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // 1. CLEANUP (Delete existing data to start fresh)
  await prisma.topic.deleteMany()
  await prisma.module.deleteMany()
  await prisma.course.deleteMany()
  await prisma.task.deleteMany()
  await prisma.taskColumn.deleteMany()
  await prisma.flashcard.deleteMany()
  await prisma.deck.deleteMany()
  await prisma.jobApplication.deleteMany()
  await prisma.event.deleteMany()

  console.log('🧹 Database cleaned.')

  // ==========================================
  // 2. COURSES (LMS)
  // ==========================================
  const dsaCourse = await prisma.course.create({
    data: {
      title: 'Data Structures & Algorithms',
      description: 'Mastering C++ DSA from Striver A2Z Sheet.',
      color: 'bg-blue-500',
      icon: 'D',
      modules: {
        create: [
          {
            title: 'Arrays & Vectors',
            status: 'completed',
            topics: {
              create: [
                { title: 'Two Sum Problem', isCompleted: true, duration: '20 min', isFocus: false },
                { title: 'Kadane Algorithm', isCompleted: true, duration: '30 min', isFocus: false },
                { title: 'Majority Element', isCompleted: true, duration: '25 min', isFocus: false },
              ]
            }
          },
          {
            title: 'Linked Lists',
            status: 'in-progress',
            topics: {
              create: [
                { title: 'Reverse Linked List', isCompleted: true, duration: '15 min', isFocus: false },
                { title: 'Detect Cycle', isCompleted: false, duration: '20 min', isFocus: true }, // Starred
                { title: 'Merge Two Sorted Lists', isCompleted: false, duration: '30 min', isFocus: true },
              ]
            }
          },
          {
            title: 'Trees & Graphs',
            status: 'pending',
            topics: {
              create: [
                { title: 'Binary Tree Traversals', isCompleted: false, duration: '40 min' },
                { title: 'BFS & DFS', isCompleted: false, duration: '45 min' },
              ]
            }
          }
        ]
      }
    }
  })

  const webDevCourse = await prisma.course.create({
    data: {
      title: 'Full Stack Web Dev',
      description: 'Building a SaaS with Next.js, Tailwind, and Prisma.',
      color: 'bg-purple-500',
      icon: 'W',
      modules: {
        create: [
          {
            title: 'Frontend Architecture',
            status: 'completed',
            topics: {
              create: [
                { title: 'React Hooks Deep Dive', isCompleted: true },
                { title: 'Tailwind CSS Tricks', isCompleted: true }
              ]
            }
          },
          {
            title: 'Backend Integration',
            status: 'in-progress',
            topics: {
              create: [
                { title: 'Prisma Schema Design', isCompleted: true },
                { title: 'Server Actions', isCompleted: false, isFocus: true },
                { title: 'Authentication with NextAuth', isCompleted: false }
              ]
            }
          }
        ]
      }
    }
  })

  // ==========================================
  // 3. TASKS (KANBAN)
  // ==========================================
  const todoCol = await prisma.taskColumn.create({ data: { title: 'Todo', order: 0 } })
  const progressCol = await prisma.taskColumn.create({ data: { title: 'In Progress', order: 1 } })
  const doneCol = await prisma.taskColumn.create({ data: { title: 'Done', order: 2 } })

  await prisma.task.createMany({
    data: [
      { content: 'Solve LeetCode Daily Challenge', columnId: todoCol.id, priority: 'high', order: 0 },
      { content: 'Update Resume with new Project', columnId: todoCol.id, priority: 'medium', order: 1 },
      { content: 'Watch System Design System Episode 4', columnId: progressCol.id, priority: 'high', order: 0 },
      { content: 'Fix hydration error in Dashboard', columnId: doneCol.id, priority: 'low', order: 0 },
    ]
  })

  // ==========================================
  // 4. JOB APPLICATIONS
  // ==========================================
  await prisma.jobApplication.createMany({
    data: [
      { company: 'Google', position: 'SDE Intern', status: 'Applied', location: 'Bangalore', salary: '1.2L/mo' },
      { company: 'Microsoft', position: 'Frontend Engineer', status: 'Interview', location: 'Hyderabad', salary: '1.5L/mo' },
      { company: 'Swiggy', position: 'Backend Intern', status: 'Rejected', location: 'Remote', salary: '45k/mo' },
      { company: 'Cred', position: 'Product Engineer', status: 'Offer', location: 'Bangalore', salary: '1.8L/mo' },
      { company: 'Razorpay', position: 'SDE 1', status: 'Applied', location: 'Bangalore', salary: '24L PA' },
    ]
  })

  // ==========================================
  // 5. FLASHCARDS
  // ==========================================
  const reactDeck = await prisma.deck.create({
    data: {
      title: 'React.js Interview',
      description: 'Core concepts, hooks, and lifecycle methods.',
      color: 'bg-blue-500',
      cards: {
        create: [
          { front: 'What is the Virtual DOM?', back: 'A lightweight copy of the real DOM...', mastery: 'easy' },
          { front: 'Explain useEffect dependency array', back: 'It controls when the effect runs...', mastery: 'medium' },
          { front: 'What is Prop Drilling?', back: 'Passing props through multiple levels...', mastery: 'hard' },
        ]
      }
    }
  })

  // ==========================================
  // 6. PLANNER (EVENTS)
  // ==========================================
  const today = new Date().toISOString().split('T')[0]
  
  await prisma.event.createMany({
    data: [
      { title: 'Morning DSA Grind', subtitle: 'Arrays', type: 'Study', date: today, startTime: '08:00', isDone: true },
      { title: 'System Design Class', subtitle: 'Live Lecture', type: 'Class', date: today, startTime: '14:00', isDone: false },
      { title: 'Gym Break', subtitle: 'Leg day', type: 'Break', date: today, startTime: '17:00', isDone: false },
    ]
  })

  console.log('✅ Seeding complete! Database is ready.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })