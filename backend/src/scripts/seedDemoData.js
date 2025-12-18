import mongoose from 'mongoose'
import dotenv from 'dotenv'
import connectDB from '../config/database.js'
import {
  User,
  Organization,
  Team,
  Project,
  Sprint,
  Feature,
  Story,
  Task,
  Activity,
  Comment,
  Notification,
  TimeEntry,
} from '../models/index.js'

dotenv.config()

const log = (msg) => console.log(`[seed-demo] ${msg}`)

async function ensureOrganization() {
  let org = await Organization.findOne({})
  if (!org) {
    org = await Organization.create({
      name: 'AgileSAFe Demo Org',
      domain: 'demo.local',
      settings: { sprintDuration: 14, workHoursPerDay: 8, defaultStoryPoints: [1, 2, 3, 5, 8, 13, 21] },
      subscription: { plan: 'pro', expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
      isActive: true,
    })
    log(`Created organization: ${org.name}`)
  } else {
    log(`Organization exists: ${org.name}`)
  }
  return org
}

async function getSomeUsers() {
  const users = await User.find({ isActive: true }).limit(20).lean()
  const managers = users.filter((u) => u.role === 'manager')
  const developers = users.filter((u) => u.role === 'developer')
  const admin = users.find((u) => u.role === 'admin')
  const anyManager = managers[0] || admin || users[0]
  return { users, managers, developers, anyManager }
}

async function ensureTeams(orgId, developers) {
  const count = await Team.countDocuments({})
  if (count > 0) {
    log(`Teams exist: ${count}`)
    return await Team.find({}).lean()
  }
  const sliceA = developers.slice(0, 5).map((d) => d._id)
  const sliceB = developers.slice(5, 10).map((d) => d._id)
  const teamAlpha = await Team.create({
    name: 'Team Alpha',
    description: 'Demo frontend/backend team',
    members: sliceA,
    organization: orgId,
    capacity: 40 * (sliceA.length || 1),
    isActive: true,
  })
  const teamBeta = await Team.create({
    name: 'Team Beta',
    description: 'Demo mobile/API team',
    members: sliceB,
    organization: orgId,
    capacity: 40 * (sliceB.length || 1),
    isActive: true,
  })
  log(`Created teams: ${teamAlpha.name}, ${teamBeta.name}`)
  return [teamAlpha.toObject(), teamBeta.toObject()]
}

async function ensureProjects(orgId, anyManager, teams) {
  const existing = await Project.countDocuments({})
  if (existing >= 3) {
    log(`Projects exist: ${existing}`)
    return await Project.find({}).lean()
  }
  const teamA = teams[0]?._id || teams[0]?.id
  const teamB = teams[1]?._id || teams[1]?.id
  const projects = await Project.insertMany([
    {
      name: 'E-Commerce Platform',
      key: 'ECOM',
      description: 'Modern e-commerce platform',
      team: teamA,
      organization: orgId,
      status: 'active',
      priority: 'high',
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      goals: ['Launch MVP', 'Payments', 'Inventory'],
      createdBy: anyManager?._id || anyManager?.id,
    },
    {
      name: 'Mobile Banking App',
      key: 'MBANK',
      description: 'Secure mobile banking application',
      team: teamB,
      organization: orgId,
      status: 'active',
      priority: 'high',
      startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      goals: ['Compliance', 'Biometric auth', 'Transactions'],
      createdBy: anyManager?._id || anyManager?.id,
    },
    {
      name: 'Analytics Dashboard',
      key: 'ANALYT',
      description: 'Real-time analytics dashboard',
      team: teamA,
      organization: orgId,
      status: 'planning',
      priority: 'medium',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      goals: ['Visualization', 'Real-time', 'Exports'],
      createdBy: anyManager?._id || anyManager?.id,
    },
  ])
  log(`Created ${projects.length} projects`)
  return projects.map((p) => p.toObject())
}

async function ensureSprints(projects) {
  const existing = await Sprint.countDocuments({})
  if (existing >= 6) {
    log(`Sprints exist: ${existing}`)
    return await Sprint.find({}).lean()
  }
  const sprints = []
  for (const project of projects.filter((p) => p.status !== 'archived')) {
    const duration = 14
    const now = new Date()
    const sprint1End = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const sprint1Start = new Date(sprint1End.getTime() - duration * 24 * 60 * 60 * 1000)
    const sprint2Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const sprint2End = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const sprint3Start = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const sprint3End = new Date(sprint3Start.getTime() + duration * 24 * 60 * 60 * 1000)

    const [s1, s2, s3] = await Sprint.insertMany([
      { name: `Sprint 1 - ${project.name}`, sprintNumber: 1, project: project._id, startDate: sprint1Start, endDate: sprint1End, status: 'completed', capacity: 80, committedPoints: 60, completedPoints: 58, velocity: 58 },
      { name: `Sprint 2 - ${project.name}`, sprintNumber: 2, project: project._id, startDate: sprint2Start, endDate: sprint2End, status: 'active', capacity: 80, committedPoints: 68, completedPoints: 34 },
      { name: `Sprint 3 - ${project.name}`, sprintNumber: 3, project: project._id, startDate: sprint3Start, endDate: sprint3End, status: 'planned', capacity: 80, committedPoints: 0 },
    ])
    sprints.push(s1.toObject(), s2.toObject(), s3.toObject())
  }
  log(`Created ${sprints.length} sprints`)
  return sprints
}

async function ensureFeaturesStoriesTasks(projects, users) {
  const featureCount = await Feature.countDocuments({})
  const storyCount = await Story.countDocuments({})
  const taskCount = await Task.countDocuments({})

  if (featureCount >= 10 && storyCount >= 40 && taskCount >= 120) {
    log('Features/Stories/Tasks exist; skipping generation')
    return
  }

  const managers = users.filter((u) => u.role === 'manager')
  const developers = users.filter((u) => u.role === 'developer')
  const storyPoints = [1, 2, 3, 5, 8, 13]
  const storyStatuses = ['backlog', 'ready', 'in-progress', 'review', 'done']
  for (const project of projects) {
    const features = await Feature.insertMany(
      ['Authentication', 'Payments', 'Analytics', 'Inventory', 'Notifications']
        .map((title) => ({
          title,
          description: `${title} for ${project.name}`,
          project: project._id,
          businessValue: Math.floor(Math.random() * 5) + 6,
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          status: project.status === 'planning' ? 'backlog' : ['backlog', 'in-progress', 'completed'][Math.floor(Math.random() * 3)],
          acceptanceCriteria: [`${title} works end-to-end`, `Errors handled for ${title}`],
          createdBy: managers[0]?._id || users[0]?._id,
        }))
    )
    const projectSprints = await Sprint.find({ project: project._id })

    const stories = []
    for (let i = 0; i < 15; i++) {
      const feature = features[Math.floor(Math.random() * features.length)]
      const status = storyStatuses[Math.floor(Math.random() * storyStatuses.length)]
      let sprint = null
      if (status === 'done') sprint = projectSprints.find((s) => s.status === 'completed')
      else if (['in-progress', 'review'].includes(status)) sprint = projectSprints.find((s) => s.status === 'active')
      else if (status === 'ready') sprint = projectSprints.find((s) => s.status === 'planned')
      const assignedTo = developers[Math.floor(Math.random() * developers.length)]?._id
      const sp = storyPoints[Math.floor(Math.random() * storyPoints.length)]
      const story = await Story.create({
        title: `Implement ${feature.title} #${i + 1}`,
        description: `As a user I want ${feature.title} so that ...`,
        storyId: `${project.key}-${i + 1}`,
        feature: feature._id,
        sprint: sprint?._id || null,
        project: project._id,
        storyPoints: sp,
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        status,
        assignedTo,
        createdBy: managers[0]?._id || users[0]?._id,
      })
      if (sprint) {
        await Sprint.findByIdAndUpdate(sprint._id, { $addToSet: { stories: story._id } })
      }
      stories.push(story)
    }

    for (const story of stories) {
      const numTasks = 4
      for (let i = 0; i < numTasks; i++) {
        const status = ['todo', 'in-progress', 'done'][Math.floor(Math.random() * 3)]
        const assignedTo = developers[Math.floor(Math.random() * developers.length)]?._id
        await Task.create({
          title: `Task ${i + 1} for ${story.storyId}`,
          description: `Complete sub-part ${i + 1}`,
          story: story._id,
          assignedTo,
          status,
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          estimatedHours: Math.floor(Math.random() * 8) + 2,
          actualHours: status === 'done' ? Math.floor(Math.random() * 8) + 2 : undefined,
          dueDate: status === 'done'
            ? new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000)
            : new Date(Date.now() + Math.floor(Math.random() * 14) * 86400000),
          createdBy: story.createdBy,
        })
      }
    }
  }
  log('Created demo features/stories/tasks')
}

async function ensureActivitiesAndNotifications() {
  const activities = await Activity.countDocuments({})
  if (activities < 25) {
    const someStories = await Story.find({}).limit(10)
    for (const story of someStories) {
      await Activity.create({
        type: 'created',
        entityType: 'story',
        entityId: story._id,
        user: story.createdBy,
        description: `Story ${story.storyId} was created`,
        metadata: { storyPoints: story.storyPoints },
      })
    }
    log('Added activities')
  }
  const notifications = await Notification.countDocuments({})
  if (notifications < 30) {
    const someUsers = await User.find({ isActive: true }).limit(5)
    for (const user of someUsers) {
      await Notification.create({
        user: user._id,
        type: 'story_updated',
        title: 'Story Updated',
        message: 'One of your watched stories has been updated',
        isRead: false,
      })
    }
    log('Added notifications')
  }
}

async function ensureTimeEntries() {
  if (!TimeEntry) return
  const count = await TimeEntry.countDocuments({})
  if (count >= 40) {
    log(`Time entries exist: ${count}`)
    return
  }
  const someTasks = await Task.find({}).limit(20)
  const someUsers = await User.find({ role: 'developer' }).limit(10)
  for (const task of someTasks) {
    const user = someUsers[Math.floor(Math.random() * someUsers.length)]
    const entries = Math.floor(Math.random() * 3) + 2
    for (let i = 0; i < entries; i++) {
      const hours = Math.random() * 3 + 1
      const start = new Date(Date.now() - (i + 1) * 86400000)
      await TimeEntry.create({
        task: task._id,
        user: user?._id,
        date: start,
        hours,
        entryType: 'manual',
        description: `Worked on ${task.title}`,
      })
    }
  }
  log('Created time entries')
}

async function run() {
  try {
    await connectDB()
    log('Connected to MongoDB')

    const org = await ensureOrganization()
    const { users, managers, developers, anyManager } = await getSomeUsers()
    await ensureTeams(org._id, developers)
    const projects = await ensureProjects(org._id, anyManager, await Team.find({}).lean())
    await ensureSprints(projects)
    await ensureFeaturesStoriesTasks(projects, users)
    await ensureActivitiesAndNotifications()
    await ensureTimeEntries()

    log('✅ Demo data seeding complete (non-destructive).')
    await mongoose.connection.close()
    process.exit(0)
  } catch (err) {
    console.error(err)
    await mongoose.connection.close()
    process.exit(1)
  }
}

run()


