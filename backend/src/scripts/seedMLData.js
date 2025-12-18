import mongoose from 'mongoose'
import dotenv from 'dotenv'
import connectDB from '../config/database.js'
import { User, Team, Project, Story, Task } from '../models/index.js'

dotenv.config()

const log = (msg) => console.log(`[seed-ml-data] ${msg}`)

/**
 * Seed ML-related data for Task Assignment and Sprint Optimization features
 * This adds:
 * - User skills, capacity, workload, performance metrics
 * - Stories with proper fields for sprint optimization
 * - Tasks for assignment testing
 */

async function seedMLUserData() {
  log('Seeding ML user data (skills, capacity, performance metrics)...')
  
  // Get all active developers
  const developers = await User.find({ 
    role: { $in: ['developer', 'manager'] },
    isActive: true 
  }).limit(20)
  
  if (developers.length === 0) {
    log('No developers found. Please seed users first.')
    return
  }
  
  const skillsSets = [
    ['JavaScript', 'React', 'Node.js', 'TypeScript'],
    ['Python', 'Django', 'PostgreSQL', 'Docker'],
    ['Java', 'Spring Boot', 'MySQL', 'Kubernetes'],
    ['C#', '.NET', 'SQL Server', 'Azure'],
    ['Go', 'Microservices', 'MongoDB', 'AWS'],
    ['PHP', 'Laravel', 'MySQL', 'Redis'],
    ['Ruby', 'Rails', 'PostgreSQL', 'Heroku'],
    ['Swift', 'iOS', 'Xcode', 'Core Data'],
    ['Kotlin', 'Android', 'Firebase', 'Material Design'],
    ['Vue.js', 'Nuxt.js', 'GraphQL', 'Vuex'],
  ]
  
  const performanceLevels = [
    { completionRate: 0.95, onTimeDelivery: 0.90, qualityScore: 0.92, velocity: 45 }, // High performer
    { completionRate: 0.85, onTimeDelivery: 0.80, qualityScore: 0.85, velocity: 35 }, // Medium performer
    { completionRate: 0.75, onTimeDelivery: 0.70, qualityScore: 0.78, velocity: 25 }, // Average performer
  ]
  
  let updated = 0
  for (let i = 0; i < developers.length; i++) {
    const dev = developers[i]
    const skills = skillsSets[i % skillsSets.length]
    const perf = performanceLevels[i % performanceLevels.length]
    
    // Calculate current workload (random between 20-80% of capacity)
    const capacity = dev.availability || 40
    const currentWorkload = Math.floor(capacity * (0.2 + Math.random() * 0.6))
    
    // Update user with ML-related fields
    await User.findByIdAndUpdate(dev._id, {
      $set: {
        skills: skills,
        capacity: capacity, // Add capacity field (ML service expects this)
        currentWorkload: currentWorkload,
        velocity: perf.velocity,
        completionRate: perf.completionRate,
        onTimeDelivery: perf.onTimeDelivery,
        qualityScore: perf.qualityScore,
        timeAccuracy: 0.85 + Math.random() * 0.1, // 0.85-0.95
        collaborationIndex: 0.7 + Math.random() * 0.2, // 0.7-0.9
        complexityHandled: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        completedSimilarTasks: Math.floor(Math.random() * 50) + 10,
        timeTrackingConsistency: 0.8 + Math.random() * 0.15, // 0.8-0.95
        timeLoggingVariance: 0.1 + Math.random() * 0.2, // 0.1-0.3
        onVacation: false,
      }
    })
    updated++
  }
  
  log(`Updated ${updated} users with ML data`)
}

async function seedMLStories() {
  log('Seeding stories for sprint optimization...')
  
  // Get active projects
  const projects = await Project.find({ status: 'active' }).limit(5)
  
  if (projects.length === 0) {
    log('No active projects found. Please seed projects first.')
    return
  }
  
  // Get a manager or admin to use as createdBy
  const creator = await User.findOne({ 
    role: { $in: ['admin', 'manager'] },
    isActive: true 
  })
  
  if (!creator) {
    log('No admin/manager found for createdBy field. Please seed users first.')
    return
  }
  
  const storyTemplates = [
    {
      title: 'User Authentication System',
      description: 'Implement secure JWT-based authentication with refresh tokens',
      storyPoints: 8,
      priority: 'high',
      complexity: 'high',
      businessValue: 10,
      requiredSkills: ['JavaScript', 'Node.js', 'Security'],
    },
    {
      title: 'Payment Gateway Integration',
      description: 'Integrate Stripe payment gateway for checkout process',
      storyPoints: 13,
      priority: 'high',
      complexity: 'high',
      businessValue: 10,
      requiredSkills: ['JavaScript', 'API Integration', 'Payment Systems'],
    },
    {
      title: 'Product Search and Filter',
      description: 'Add advanced search and filtering capabilities to product catalog',
      storyPoints: 5,
      priority: 'medium',
      complexity: 'medium',
      businessValue: 7,
      requiredSkills: ['React', 'JavaScript', 'Search'],
    },
    {
      title: 'User Dashboard',
      description: 'Create user dashboard with analytics and activity feed',
      storyPoints: 8,
      priority: 'medium',
      complexity: 'medium',
      businessValue: 8,
      requiredSkills: ['React', 'TypeScript', 'Charts'],
    },
    {
      title: 'Email Notification System',
      description: 'Set up email notifications for user actions and system events',
      storyPoints: 5,
      priority: 'medium',
      complexity: 'low',
      businessValue: 6,
      requiredSkills: ['Node.js', 'Email', 'Templates'],
    },
    {
      title: 'API Rate Limiting',
      description: 'Implement rate limiting for API endpoints to prevent abuse',
      storyPoints: 3,
      priority: 'high',
      complexity: 'medium',
      businessValue: 8,
      requiredSkills: ['Node.js', 'Security', 'Middleware'],
    },
    {
      title: 'Database Migration Scripts',
      description: 'Create migration scripts for database schema updates',
      storyPoints: 5,
      priority: 'low',
      complexity: 'medium',
      businessValue: 5,
      requiredSkills: ['Database', 'Migrations', 'SQL'],
    },
    {
      title: 'Unit Test Coverage',
      description: 'Increase unit test coverage to 80% for critical modules',
      storyPoints: 8,
      priority: 'medium',
      complexity: 'low',
      businessValue: 7,
      requiredSkills: ['Testing', 'Jest', 'Quality'],
    },
    {
      title: 'Mobile Responsive Design',
      description: 'Make application fully responsive for mobile devices',
      storyPoints: 5,
      priority: 'high',
      complexity: 'medium',
      businessValue: 9,
      requiredSkills: ['CSS', 'Responsive Design', 'Mobile'],
    },
    {
      title: 'Performance Optimization',
      description: 'Optimize database queries and API response times',
      storyPoints: 8,
      priority: 'medium',
      complexity: 'high',
      businessValue: 8,
      requiredSkills: ['Performance', 'Database', 'Optimization'],
    },
  ]
  
  let created = 0
  for (const project of projects) {
    // Get or create a feature for this project
    const { Feature } = await import('../models/index.js')
    let feature = await Feature.findOne({ project: project._id })
    
    if (!feature) {
      feature = await Feature.create({
        title: 'Core Features',
        description: 'Core application features',
        project: project._id,
        status: 'in-progress',
        priority: 'high',
      })
    }
    
    // Create stories for this project
    for (const template of storyTemplates) {
      const existing = await Story.findOne({
        project: project._id,
        title: template.title,
      })
      
      if (!existing) {
        try {
          await Story.create({
            title: template.title,
            description: template.description,
            storyPoints: template.storyPoints,
            priority: template.priority,
            status: 'ready', // Ready for sprint planning
            project: project._id,
            feature: feature._id,
            createdBy: creator._id,
            acceptanceCriteria: [
              'Story meets all acceptance criteria',
              'Code is reviewed and approved',
              'Tests are passing',
            ],
            // ML-related fields
            complexity: template.complexity,
            businessValue: template.businessValue,
            requiredSkills: template.requiredSkills,
          })
          created++
        } catch (error) {
          // Skip if duplicate (might be created by another process)
          if (error.code === 11000) {
            log(`Story "${template.title}" already exists, skipping`)
          } else {
            throw error
          }
        }
      }
    }
  }
  
  log(`Created/verified ${created} stories for sprint optimization`)
}

async function seedMLTasks() {
  log('Seeding tasks for assignment testing...')
  
  // Get ready stories
  const stories = await Story.find({ status: 'ready' }).limit(20)
  
  if (stories.length === 0) {
    log('No ready stories found. Stories will be created when stories are added.')
    return
  }
  
  // Get a manager or admin to use as createdBy
  const creator = await User.findOne({ 
    role: { $in: ['admin', 'manager'] },
    isActive: true 
  })
  
  if (!creator) {
    log('No admin/manager found for createdBy field.')
    return
  }
  
  const taskTemplates = [
    { title: 'Design API endpoints', estimatedHours: 4, priority: 'high' },
    { title: 'Implement database schema', estimatedHours: 6, priority: 'high' },
    { title: 'Write unit tests', estimatedHours: 3, priority: 'medium' },
    { title: 'Create UI components', estimatedHours: 8, priority: 'medium' },
    { title: 'Add error handling', estimatedHours: 2, priority: 'medium' },
    { title: 'Write documentation', estimatedHours: 3, priority: 'low' },
    { title: 'Code review and refactoring', estimatedHours: 4, priority: 'high' },
    { title: 'Integration testing', estimatedHours: 5, priority: 'high' },
  ]
  
  let created = 0
  for (const story of stories) {
    // Create 2-4 tasks per story
    const numTasks = 2 + Math.floor(Math.random() * 3)
    
    for (let i = 0; i < numTasks && i < taskTemplates.length; i++) {
      const template = taskTemplates[i]
      const existing = await Task.findOne({
        story: story._id,
        title: template.title,
      })
      
      if (!existing) {
        await Task.create({
          title: template.title,
          description: `${template.title} for ${story.title}`,
          story: story._id,
          status: 'todo',
          priority: template.priority,
          estimatedHours: template.estimatedHours,
          storyPoints: Math.ceil(template.estimatedHours / 8), // Rough conversion
          createdBy: creator._id,
        })
        created++
      }
    }
  }
  
  log(`Created/verified ${created} tasks for assignment testing`)
}

async function main() {
  try {
    await connectDB()
    log('Connected to database')
    
    await seedMLUserData()
    await seedMLStories()
    await seedMLTasks()
    
    log('✅ ML data seeding completed!')
    process.exit(0)
  } catch (error) {
    log(`❌ Error: ${error.message}`)
    console.error(error)
    process.exit(1)
  }
}

main()

