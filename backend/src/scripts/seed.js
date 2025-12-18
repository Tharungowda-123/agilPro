import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
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
} from '../models/index.js'

// Load environment variables
dotenv.config()

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
}

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Check for --force flag
const force = process.argv.includes('--force')

// Store created IDs for references
const createdData = {
  users: [],
  organization: null,
  teams: [],
  projects: [],
  sprints: [],
  features: [],
  stories: [],
  tasks: [],
}

/**
 * Clear all existing data
 */
async function clearDatabase() {
  if (!force) {
    log('\n⚠️  WARNING: This will delete ALL existing data!', 'yellow')
    log('Press Ctrl+C to cancel, or run with --force flag to skip confirmation\n', 'yellow')
    
    // In a real scenario, you might want to use readline for confirmation
    // For now, we'll just wait a bit
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }

  log('🗑️  Clearing existing data...', 'yellow')
  
  await User.deleteMany({})
  await Organization.deleteMany({})
  await Team.deleteMany({})
  await Project.deleteMany({})
  await Sprint.deleteMany({})
  await Feature.deleteMany({})
  await Story.deleteMany({})
  await Task.deleteMany({})
  await Activity.deleteMany({})
  await Comment.deleteMany({})
  await Notification.deleteMany({})
  
  log('✅ Database cleared', 'green')
}

/**
 * Hash password
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

/**
 * Create Users
 */
async function createUsers() {
  log('\n👥 Creating users...', 'cyan')
  
  const users = []
  
  // Admin user
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@agilesafe.com',
    password: await hashPassword('Admin@123'),
    role: 'admin',
    skills: ['Management', 'Leadership'],
    isActive: true,
    isEmailVerified: true,
  })
  users.push(admin)
  log(`  ✓ Created admin: ${admin.email}`, 'green')
  
  // Manager users
  const managers = [
    { name: 'Manager One', email: 'manager1@agilesafe.com' },
    { name: 'Manager Two', email: 'manager2@agilesafe.com' },
  ]
  
  for (const managerData of managers) {
    const manager = await User.create({
      ...managerData,
      password: await hashPassword('Manager@123'),
      role: 'manager',
      skills: ['Project Management', 'Scrum'],
      isActive: true,
      isEmailVerified: true,
    })
    users.push(manager)
    log(`  ✓ Created manager: ${manager.email}`, 'green')
  }
  
  // Developer users
  const developers = [
    { name: 'Alice Johnson', email: 'alice@agilesafe.com', skills: ['React', 'Node.js', 'UI/UX'] },
    { name: 'Bob Smith', email: 'bob@agilesafe.com', skills: ['Python', 'Backend', 'API Design'] },
    { name: 'Charlie Brown', email: 'charlie@agilesafe.com', skills: ['MongoDB', 'DevOps', 'Testing'] },
    { name: 'Diana Prince', email: 'diana@agilesafe.com', skills: ['React', 'Frontend', 'UI/UX'] },
    { name: 'Eve Wilson', email: 'eve@agilesafe.com', skills: ['Node.js', 'Backend', 'API Design'] },
    { name: 'Frank Miller', email: 'frank@agilesafe.com', skills: ['Python', 'MongoDB', 'DevOps'] },
    { name: 'Grace Lee', email: 'grace@agilesafe.com', skills: ['React', 'Frontend', 'Testing'] },
    { name: 'Henry Davis', email: 'henry@agilesafe.com', skills: ['Node.js', 'Backend', 'API Design'] },
    { name: 'Ivy Chen', email: 'ivy@agilesafe.com', skills: ['Python', 'UI/UX', 'Testing'] },
    { name: 'Jack Robinson', email: 'jack@agilesafe.com', skills: ['MongoDB', 'DevOps', 'Backend'] },
  ]
  
  for (const devData of developers) {
    const availability = Math.floor(Math.random() * 21) + 30 // 30-50
    const developer = await User.create({
      name: devData.name,
      email: devData.email,
      password: await hashPassword('Developer@123'),
      role: 'developer',
      skills: devData.skills,
      availability,
      isActive: true,
      isEmailVerified: true,
    })
    users.push(developer)
    log(`  ✓ Created developer: ${developer.email} (availability: ${availability})`, 'green')
  }
  
  // Viewer users
  const viewers = [
    { name: 'Viewer One', email: 'viewer1@agilesafe.com' },
    { name: 'Viewer Two', email: 'viewer2@agilesafe.com' },
  ]
  
  for (const viewerData of viewers) {
    const viewer = await User.create({
      ...viewerData,
      password: await hashPassword('Viewer@123'),
      role: 'viewer',
      isActive: true,
      isEmailVerified: true,
    })
    users.push(viewer)
    log(`  ✓ Created viewer: ${viewer.email}`, 'green')
  }
  
  createdData.users = users
  log(`✅ Created ${users.length} users`, 'green')
  return users
}

/**
 * Create Organization
 */
async function createOrganization() {
  log('\n🏢 Creating organization...', 'cyan')
  
  const organization = await Organization.create({
    name: 'AgileSAFe Tech Solutions',
    domain: 'agilesafe.com',
    settings: {
      sprintDuration: 14,
      workHoursPerDay: 8,
      defaultStoryPoints: [1, 2, 3, 5, 8, 13, 21],
    },
    subscription: {
      plan: 'pro',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
    isActive: true,
  })
  
  createdData.organization = organization
  log(`✅ Created organization: ${organization.name}`, 'green')
  return organization
}

/**
 * Create Teams
 */
async function createTeams() {
  log('\n👨‍👩‍👧‍👦 Creating teams...', 'cyan')
  
  const managers = createdData.users.filter((u) => u.role === 'manager')
  const developers = createdData.users.filter((u) => u.role === 'developer')
  
  // Team Alpha: 5 developers + 1 manager
  const teamAlpha = await Team.create({
    name: 'Team Alpha',
    description: 'Frontend and Backend development team',
    members: [
      managers[0]._id,
      ...developers.slice(0, 5).map((d) => d._id),
    ],
    organization: createdData.organization._id,
    capacity: developers.slice(0, 5).reduce((sum, d) => sum + d.availability, 0),
    isActive: true,
  })
  
  // Update users to reference team
  await User.updateMany(
    { _id: { $in: teamAlpha.members } },
    { $set: { team: teamAlpha._id } }
  )
  
  createdData.teams.push(teamAlpha)
  log(`  ✓ Created Team Alpha with ${teamAlpha.members.length} members`, 'green')
  
  // Team Beta: 5 developers + 1 manager
  const teamBeta = await Team.create({
    name: 'Team Beta',
    description: 'Mobile and API development team',
    members: [
      managers[1]._id,
      ...developers.slice(5, 10).map((d) => d._id),
    ],
    organization: createdData.organization._id,
    capacity: developers.slice(5, 10).reduce((sum, d) => sum + d.availability, 0),
    isActive: true,
  })
  
  // Update users to reference team
  await User.updateMany(
    { _id: { $in: teamBeta.members } },
    { $set: { team: teamBeta._id } }
  )
  
  createdData.teams.push(teamBeta)
  log(`  ✓ Created Team Beta with ${teamBeta.members.length} members`, 'green')
  
  log(`✅ Created ${createdData.teams.length} teams`, 'green')
  return createdData.teams
}

/**
 * Create Projects
 */
async function createProjects() {
  log('\n📁 Creating projects...', 'cyan')
  
  const projects = [
    {
      name: 'E-Commerce Platform',
      key: 'ECOM',
      description: 'Modern e-commerce platform with payment integration and inventory management',
      team: createdData.teams[0]._id,
      organization: createdData.organization._id,
      status: 'active',
      priority: 'high',
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      goals: ['Launch MVP', 'Integrate payment gateway', 'Implement inventory system'],
      createdBy: createdData.users.find((u) => u.role === 'manager')._id,
    },
    {
      name: 'Mobile Banking App',
      key: 'MBANK',
      description: 'Secure mobile banking application with biometric authentication',
      team: createdData.teams[1]._id,
      organization: createdData.organization._id,
      status: 'active',
      priority: 'high',
      startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      goals: ['Security compliance', 'Biometric auth', 'Transaction history'],
      createdBy: createdData.users.find((u) => u.role === 'manager')._id,
    },
    {
      name: 'Analytics Dashboard',
      key: 'ANALYT',
      description: 'Real-time analytics dashboard with data visualization',
      team: createdData.teams[0]._id,
      organization: createdData.organization._id,
      status: 'planning',
      priority: 'medium',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      goals: ['Data visualization', 'Real-time updates', 'Export functionality'],
      createdBy: createdData.users.find((u) => u.role === 'manager')._id,
    },
  ]
  
  for (const projectData of projects) {
    const project = await Project.create(projectData)
    createdData.projects.push(project)
    log(`  ✓ Created project: ${project.name} (${project.key})`, 'green')
  }
  
  log(`✅ Created ${createdData.projects.length} projects`, 'green')
  return createdData.projects
}

/**
 * Create Sprints
 */
async function createSprints() {
  log('\n🏃 Creating sprints...', 'cyan')
  
  const activeProjects = createdData.projects.filter((p) => p.status === 'active')
  
  for (const project of activeProjects) {
    const sprintDuration = 14 // days
    const now = new Date()
    
    // Sprint 1: Completed (ended 14 days ago)
    const sprint1End = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const sprint1Start = new Date(sprint1End.getTime() - sprintDuration * 24 * 60 * 60 * 1000)
    
    const sprint1 = await Sprint.create({
      name: `Sprint 1 - ${project.name}`,
      sprintNumber: 1,
      project: project._id,
      goal: 'Complete MVP features',
      startDate: sprint1Start,
      endDate: sprint1End,
      status: 'completed',
      capacity: 80,
      committedPoints: 65,
      completedPoints: 60,
      velocity: 60,
    })
    createdData.sprints.push(sprint1)
    log(`  ✓ Created completed sprint for ${project.name}`, 'green')
    
    // Sprint 2: Active (started 7 days ago, ends in 7 days)
    const sprint2Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const sprint2End = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const sprint2 = await Sprint.create({
      name: `Sprint 2 - ${project.name}`,
      sprintNumber: 2,
      project: project._id,
      goal: 'Enhance core features',
      startDate: sprint2Start,
      endDate: sprint2End,
      status: 'active',
      capacity: 80,
      committedPoints: 70,
      completedPoints: 35,
    })
    createdData.sprints.push(sprint2)
    log(`  ✓ Created active sprint for ${project.name}`, 'green')
    
    // Sprint 3: Planned (starts in 7 days)
    const sprint3Start = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const sprint3End = new Date(sprint3Start.getTime() + sprintDuration * 24 * 60 * 60 * 1000)
    
    const sprint3 = await Sprint.create({
      name: `Sprint 3 - ${project.name}`,
      sprintNumber: 3,
      project: project._id,
      goal: 'Add advanced features',
      startDate: sprint3Start,
      endDate: sprint3End,
      status: 'planned',
      capacity: 80,
      committedPoints: 0,
    })
    createdData.sprints.push(sprint3)
    log(`  ✓ Created planned sprint for ${project.name}`, 'green')
  }
  
  log(`✅ Created ${createdData.sprints.length} sprints`, 'green')
  return createdData.sprints
}

/**
 * Create Features
 */
async function createFeatures() {
  log('\n✨ Creating features...', 'cyan')
  
  const featureTemplates = [
    { title: 'User Authentication', businessValue: 10, priority: 'high' },
    { title: 'Payment Gateway Integration', businessValue: 9, priority: 'high' },
    { title: 'Dashboard Analytics', businessValue: 8, priority: 'medium' },
    { title: 'Inventory Management', businessValue: 8, priority: 'high' },
    { title: 'Search and Filter', businessValue: 7, priority: 'medium' },
    { title: 'Notification System', businessValue: 6, priority: 'low' },
    { title: 'Reporting', businessValue: 7, priority: 'medium' },
  ]
  
  for (const project of createdData.projects) {
    const featuresForProject = featureTemplates.slice(0, Math.floor(Math.random() * 3) + 5) // 5-7 features
    
    for (const template of featuresForProject) {
      const feature = await Feature.create({
        ...template,
        description: `${template.title} for ${project.name}`,
        project: project._id,
        status: project.status === 'planning' ? 'backlog' : ['backlog', 'in-progress', 'completed'][Math.floor(Math.random() * 3)],
        acceptanceCriteria: [
          `User can ${template.title.toLowerCase()}`,
          `System validates ${template.title.toLowerCase()} correctly`,
          `Error handling for ${template.title.toLowerCase()} failures`,
        ],
        createdBy: createdData.users.find((u) => u.role === 'manager')._id,
      })
      createdData.features.push(feature)
    }
    log(`  ✓ Created ${featuresForProject.length} features for ${project.name}`, 'green')
  }
  
  log(`✅ Created ${createdData.features.length} features`, 'green')
  return createdData.features
}

/**
 * Create Stories
 */
async function createStories() {
  log('\n📖 Creating stories...', 'cyan')
  
  const storyPoints = [1, 2, 3, 5, 8, 13]
  const statuses = ['backlog', 'ready', 'in-progress', 'review', 'done']
  
  for (const project of createdData.projects) {
    const projectFeatures = createdData.features.filter((f) => f.project.toString() === project._id.toString())
    const projectSprints = createdData.sprints.filter((s) => s.project.toString() === project._id.toString())
    
    // Get team members - need to find users whose team matches project's team
    const projectTeamId = project.team.toString()
    const teamMembers = createdData.users.filter((u) => {
      if (!u.team) return false
      return u.team.toString() === projectTeamId
    })
    const developers = teamMembers.filter((u) => u.role === 'developer')
    
    const numStories = Math.floor(Math.random() * 11) + 20 // 20-30 stories
    
    for (let i = 0; i < numStories; i++) {
      const feature = projectFeatures[Math.floor(Math.random() * projectFeatures.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const storyPointsValue = storyPoints[Math.floor(Math.random() * storyPoints.length)]
      
      // Assign to sprint based on status
      let sprint = null
      if (status === 'done' && projectSprints.find((s) => s.status === 'completed')) {
        sprint = projectSprints.find((s) => s.status === 'completed')
      } else if (['in-progress', 'review'].includes(status) && projectSprints.find((s) => s.status === 'active')) {
        sprint = projectSprints.find((s) => s.status === 'active')
      } else if (status === 'ready' && projectSprints.find((s) => s.status === 'planned')) {
        sprint = projectSprints.find((s) => s.status === 'planned')
      }
      
      // Assign to developer randomly
      const assignedTo = developers.length > 0 ? developers[Math.floor(Math.random() * developers.length)]._id : null
      
      // Generate story ID
      const storyId = `${project.key}-${i + 1}`
      
      const story = await Story.create({
        title: `Implement ${feature.title} - Part ${i + 1}`,
        description: `As a user, I want to ${feature.title.toLowerCase()} so that I can use the system effectively.`,
        storyId,
        feature: feature._id,
        sprint: sprint ? sprint._id : null,
        project: project._id,
        storyPoints: storyPointsValue,
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        status,
        assignedTo,
        acceptanceCriteria: [
          `Given I am a user, when I ${feature.title.toLowerCase()}, then the system should respond correctly`,
          `Given I am a user, when I ${feature.title.toLowerCase()} with invalid data, then the system should show an error`,
        ],
        aiInsights: Math.random() > 0.5
          ? {
              complexity: Math.floor(Math.random() * 5) + 1,
              complexityScore: Math.floor(Math.random() * 5) + 1,
              complexityLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
              complexityBreakdown: {
                ui: Math.floor(Math.random() * 3) + 1,
                backend: Math.floor(Math.random() * 3) + 1,
                integration: Math.floor(Math.random() * 3) + 1,
                testing: Math.floor(Math.random() * 3) + 1,
              },
              estimatedPoints: storyPointsValue,
              confidence: Math.random() * 0.3 + 0.7,
              factors: ['Performance considerations', 'External API dependency'],
              requirements: ['User can trigger this flow', 'System validates input values'],
              similarStories: [],
              analyzedAt: new Date(),
              modelVersion: 'seed',
            }
          : undefined,
        createdBy: assignedTo || createdData.users.find((u) => u.role === 'manager')._id,
      })
      
      createdData.stories.push(story)
      
      // Update sprint stories array
      if (sprint) {
        await Sprint.findByIdAndUpdate(sprint._id, {
          $push: { stories: story._id },
        })
      }
    }
    
    log(`  ✓ Created ${numStories} stories for ${project.name}`, 'green')
  }
  
  log(`✅ Created ${createdData.stories.length} stories`, 'green')
  return createdData.stories
}

/**
 * Create Tasks
 */
async function createTasks() {
  log('\n✅ Creating tasks...', 'cyan')
  
  const taskStatuses = ['todo', 'in-progress', 'done']
  const developers = createdData.users.filter((u) => u.role === 'developer')
  
  for (const story of createdData.stories) {
    const numTasks = Math.floor(Math.random() * 3) + 3 // 3-5 tasks
    
    for (let i = 0; i < numTasks; i++) {
      const status = taskStatuses[Math.floor(Math.random() * taskStatuses.length)]
      const estimatedHours = Math.floor(Math.random() * 8) + 2 // 2-10 hours
      const actualHours = status === 'done' ? estimatedHours + Math.floor(Math.random() * 3) - 1 : null
      
      // Assign based on story assignment or random developer
      let assignedTo = story.assignedTo
      if (!assignedTo && developers.length > 0) {
        assignedTo = developers[Math.floor(Math.random() * developers.length)]._id
      }
      
      const task = await Task.create({
        title: `Task ${i + 1} for ${story.title}`,
        description: `Complete ${story.title.toLowerCase()} - task ${i + 1}`,
        story: story._id,
        assignedTo,
        status,
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        estimatedHours,
        actualHours,
        dueDate: status === 'done' ? new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000) : new Date(Date.now() + Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000),
        aiRecommendation: Math.random() > 0.7 ? {
          suggestedAssignee: assignedTo,
          confidence: Math.random() * 0.3 + 0.7,
          reasoning: 'Based on skills and availability',
        } : undefined,
        createdBy: assignedTo || createdData.users.find((u) => u.role === 'manager')._id,
      })
      
      createdData.tasks.push(task)
      
      // Update story tasks array
      await Story.findByIdAndUpdate(story._id, {
        $push: { tasks: task._id },
      })
    }
  }
  
  log(`✅ Created ${createdData.tasks.length} tasks`, 'green')
  return createdData.tasks
}

/**
 * Create Activities
 */
async function createActivities() {
  log('\n📝 Creating activities...', 'cyan')
  
  const activityTypes = ['created', 'updated', 'deleted', 'assigned', 'completed', 'moved', 'commented']
  const entityTypes = ['project', 'sprint', 'story', 'task']
  
  // Create activities for projects
  for (const project of createdData.projects) {
    await Activity.create({
      type: 'created',
      entityType: 'project',
      entityId: project._id,
      user: project.createdBy,
      description: `Project ${project.name} was created`,
      metadata: { projectKey: project.key },
    })
  }
  
  // Create activities for sprints
  for (const sprint of createdData.sprints) {
    await Activity.create({
      type: sprint.status === 'completed' ? 'completed' : sprint.status === 'active' ? 'updated' : 'created',
      entityType: 'sprint',
      entityId: sprint._id,
      user: createdData.users.find((u) => u.role === 'manager')._id,
      description: `Sprint ${sprint.name} was ${sprint.status}`,
      metadata: { sprintNumber: sprint.sprintNumber },
    })
  }
  
  // Create activities for stories
  for (const story of createdData.stories.slice(0, 30)) { // Limit to 30 to avoid too many
    const activityType = story.status === 'done' ? 'completed' : story.assignedTo ? 'assigned' : 'created'
    await Activity.create({
      type: activityType,
      entityType: 'story',
      entityId: story._id,
      user: story.createdBy,
      description: `Story ${story.storyId} was ${activityType}`,
      metadata: { storyPoints: story.storyPoints },
    })
  }
  
  // Create activities for tasks
  for (const task of createdData.tasks.slice(0, 20)) { // Limit to 20
    const activityType = task.status === 'done' ? 'completed' : task.assignedTo ? 'assigned' : 'created'
    await Activity.create({
      type: activityType,
      entityType: 'task',
      entityId: task._id,
      user: task.createdBy,
      description: `Task "${task.title}" was ${activityType}`,
      metadata: { estimatedHours: task.estimatedHours },
    })
  }
  
  log('✅ Created 50+ activities', 'green')
}

/**
 * Create Comments
 */
async function createComments() {
  log('\n💬 Creating comments...', 'cyan')
  
  const commentTemplates = [
    'Great work on this!',
    'Can we add more details here?',
    'This looks good to me.',
    'I have a question about this implementation.',
    'Let me review this and get back to you.',
    'This needs some adjustments.',
    'Perfect! Ready to merge.',
  ]
  
  // Comments on stories
  const storiesWithComments = createdData.stories.slice(0, 15)
  for (const story of storiesWithComments) {
    const numComments = Math.floor(Math.random() * 3) + 1 // 1-3 comments
    
    // Find project to get team
    const project = createdData.projects.find((p) => p._id.toString() === story.project.toString())
    if (!project) continue
    
    const projectTeamId = project.team.toString()
    let teamMembers = createdData.users.filter((u) => {
      if (!u.team) return false
      return u.team.toString() === projectTeamId
    })
    
    // Fallback to all users if no team members found
    if (teamMembers.length === 0) {
      teamMembers = createdData.users.filter((u) => u.role !== 'viewer')
    }
    
    // Skip if still no users available
    if (teamMembers.length === 0) continue
    
    for (let i = 0; i < numComments; i++) {
      const commenter = teamMembers[Math.floor(Math.random() * teamMembers.length)]
      if (!commenter) continue
      
      const content = commentTemplates[Math.floor(Math.random() * commentTemplates.length)]
      
      // Add @mention randomly
      const mentionUser = Math.random() > 0.7 && teamMembers.length > 1
        ? teamMembers.filter((u) => u._id.toString() !== commenter._id.toString())[Math.floor(Math.random() * (teamMembers.length - 1))]
        : null
      
      const comment = await Comment.create({
        content: mentionUser ? `${content} @${mentionUser.name}` : content,
        entityType: 'story',
        entityId: story._id,
        user: commenter._id,
        mentions: mentionUser ? [mentionUser._id] : [],
      })
      
      // Create notification for mention
      if (mentionUser) {
        await Notification.create({
          user: mentionUser._id,
          type: 'mention',
          title: 'You were mentioned',
          message: `${commenter.name} mentioned you in a comment on story ${story.storyId}`,
          entityType: 'story',
          entityId: story._id,
          isRead: false,
        })
      }
    }
  }
  
  // Comments on tasks
  const tasksWithComments = createdData.tasks.slice(0, 10)
  for (const task of tasksWithComments) {
    const availableUsers = createdData.users.filter((u) => u.role !== 'viewer')
    if (availableUsers.length === 0) continue
    
    const commenter = availableUsers[Math.floor(Math.random() * availableUsers.length)]
    if (!commenter) continue
    
    const content = commentTemplates[Math.floor(Math.random() * commentTemplates.length)]
    
    await Comment.create({
      content,
      entityType: 'task',
      entityId: task._id,
      user: commenter._id,
    })
  }
  
  log('✅ Created 20+ comments', 'green')
}

/**
 * Create Notifications
 */
async function createNotifications() {
  log('\n🔔 Creating notifications...', 'cyan')
  
  for (const user of createdData.users) {
    const numNotifications = Math.floor(Math.random() * 5) + 10 // 10-15 notifications
    
    for (let i = 0; i < numNotifications; i++) {
      const notificationTypes = ['task_assigned', 'mention', 'story_updated', 'sprint_started']
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)]
      
      let title = ''
      let message = ''
      let entityType = null
      let entityId = null
      
      switch (type) {
        case 'task_assigned':
          const task = createdData.tasks[Math.floor(Math.random() * createdData.tasks.length)]
          title = 'Task Assigned'
          message = `You have been assigned to task: ${task.title}`
          entityType = 'task'
          entityId = task._id
          break
        case 'mention':
          title = 'You were mentioned'
          message = 'Someone mentioned you in a comment'
          break
        case 'story_updated':
          const story = createdData.stories[Math.floor(Math.random() * createdData.stories.length)]
          title = 'Story Updated'
          message = `Story ${story.storyId} has been updated`
          entityType = 'story'
          entityId = story._id
          break
        case 'sprint_started':
          const sprint = createdData.sprints.find((s) => s.status === 'active')
          if (sprint) {
            title = 'Sprint Started'
            message = `Sprint ${sprint.name} has started`
            entityType = 'sprint'
            entityId = sprint._id
          }
          break
      }
      
      if (title) {
        await Notification.create({
          user: user._id,
          type,
          title,
          message,
          entityType,
          entityId,
          isRead: Math.random() > 0.5, // Random read/unread
        })
      }
    }
  }
  
  log('✅ Created 10+ notifications per user', 'green')
}

/**
 * Main seeding function
 */
async function seed() {
  try {
    log('\n🌱 Starting database seeding...', 'blue')
    log('=' .repeat(50), 'blue')
    
    // Connect to database
    await connectDB()
    log('✅ Connected to MongoDB', 'green')
    
    // Clear existing data
    await clearDatabase()
    
    // Create data in order
    await createUsers()
    await createOrganization()
    await createTeams()
    await createProjects()
    await createSprints()
    await createFeatures()
    await createStories()
    await createTasks()
    await createActivities()
    await createComments()
    await createNotifications()
    
    log('\n' + '='.repeat(50), 'blue')
    log('✅ Database seeding completed successfully!', 'green')
    log('\n📊 Summary:', 'cyan')
    log(`  - Users: ${createdData.users.length}`, 'cyan')
    log(`  - Organization: 1`, 'cyan')
    log(`  - Teams: ${createdData.teams.length}`, 'cyan')
    log(`  - Projects: ${createdData.projects.length}`, 'cyan')
    log(`  - Sprints: ${createdData.sprints.length}`, 'cyan')
    log(`  - Features: ${createdData.features.length}`, 'cyan')
    log(`  - Stories: ${createdData.stories.length}`, 'cyan')
    log(`  - Tasks: ${createdData.tasks.length}`, 'cyan')
    log('\n🔑 Test Credentials:', 'yellow')
    log('  Admin: admin@agilesafe.com / Admin@123', 'yellow')
    log('  Manager: manager1@agilesafe.com / Manager@123', 'yellow')
    log('  Developer: alice@agilesafe.com / Developer@123', 'yellow')
    log('  Viewer: viewer1@agilesafe.com / Viewer@123', 'yellow')
    
    // Close connection
    await mongoose.connection.close()
    log('\n✅ Database connection closed', 'green')
    process.exit(0)
  } catch (error) {
    log(`\n❌ Error seeding database: ${error.message}`, 'red')
    console.error(error)
    await mongoose.connection.close()
    process.exit(1)
  }
}

// Run seeding
seed()

