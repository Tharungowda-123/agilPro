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
} from '../models/index.js'

dotenv.config()

const log = (message) => console.log(`\n${message}`)

/**
 * Seed 2 Complete Projects with Everything
 * - Projects with teams assigned
 * - Sprints (active and planned)
 * - Stories with proper format
 * - Tasks assigned to developers
 * - Some completed tasks to show the flow
 */

async function seedCompleteProjects() {
  try {
    await connectDB()
    log('✅ Connected to database')

    // Get existing organization
    let organization = await Organization.findOne({ isActive: true })
    if (!organization) {
      organization = await Organization.create({
        name: 'AgileSAFe Organization',
        domain: 'agilesafe.com',
        isActive: true,
      })
      log('✅ Created organization')
    }

    // Get existing teams
    const teams = await Team.find({ isActive: true }).populate('members')
    if (teams.length < 2) {
      log('⚠️  Need at least 2 teams. Please create teams first.')
      return
    }

    const teamAlpha = teams.find(t => t.name?.includes('Alpha')) || teams[0]
    const teamBeta = teams.find(t => t.name?.includes('Beta')) || teams[1] || teams[0]

    // Get developers from teams
    const developersAlpha = teamAlpha.members?.filter(m => {
      const member = m._id || m
      return member.role === 'developer' || member.role === undefined
    }) || []
    const developersBeta = teamBeta.members?.filter(m => {
      const member = m._id || m
      return member.role === 'developer' || member.role === undefined
    }) || []

    // Get admin/manager for createdBy
    const admin = await User.findOne({ role: 'admin' }) || 
                  await User.findOne({ role: 'manager' }) ||
                  await User.findOne()

    if (!admin) {
      log('⚠️  No admin/manager found. Please create users first.')
      return
    }

    log(`\n📦 Creating Project 1: E-Commerce Platform`)
    log(`   Team: ${teamAlpha.name}`)
    log(`   Developers: ${developersAlpha.length}`)

    // Check if project already exists
    let project1 = await Project.findOne({ key: 'ECOM' })
    if (!project1) {
      project1 = await Project.create({
        name: 'E-Commerce Platform',
        key: 'ECOM',
        description: 'Build a modern e-commerce platform with shopping cart, checkout, and payment integration',
        organization: organization._id,
        team: teamAlpha._id,
        status: 'active',
        priority: 'high',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-06-30'),
        createdBy: admin._id,
      })
      log(`✅ Created project: ${project1.name} (${project1.key})`)
    } else {
      log(`✅ Using existing project: ${project1.name} (${project1.key})`)
    }

    // Feature for Project 1
    let feature1 = await Feature.findOne({ project: project1._id, title: 'Shopping Experience' })
    if (!feature1) {
      feature1 = await Feature.create({
        title: 'Shopping Experience',
        description: 'Core shopping features including cart, checkout, and payments',
        project: project1._id,
        status: 'in-progress',
        priority: 'high',
        createdBy: admin._id,
      })
    }

    // SPRINT 1 for Project 1 (Active)
    let sprint1 = await Sprint.findOne({ project: project1._id, name: 'Sprint 1: Shopping Cart' })
    if (!sprint1) {
      const sprint1Start = new Date()
      sprint1Start.setDate(sprint1Start.getDate() - 7) // Started 7 days ago
      const sprint1End = new Date(sprint1Start)
      sprint1End.setDate(sprint1End.getDate() + 14) // 2 weeks sprint

      sprint1 = await Sprint.create({
        name: 'Sprint 1: Shopping Cart',
        project: project1._id,
        startDate: sprint1Start,
        endDate: sprint1End,
        status: 'active',
        goal: 'Implement shopping cart functionality',
        createdBy: admin._id,
      })
      log(`✅ Created active sprint: ${sprint1.name}`)
    } else {
      log(`✅ Using existing sprint: ${sprint1.name}`)
    }

    // Stories for Sprint 1
    const stories1 = []
    let story1 = await Story.findOne({ storyId: 'ECOM-1' })
    if (!story1) {
      story1 = await Story.create({
        title: 'As a customer, I want to add products to my cart so that I can purchase multiple items',
        description: 'Users should be able to add products to shopping cart, view cart contents, and update quantities',
        storyId: 'ECOM-1',
        project: project1._id,
        feature: feature1._id,
        sprint: sprint1._id,
        storyPoints: 5,
        priority: 'high',
        status: 'in-progress',
        acceptanceCriteria: [
          'User can click "Add to Cart" button on product page',
          'Cart icon shows item count in header',
          'User can view cart contents in sidebar/dropdown',
          'User can update quantity or remove items',
        ],
        createdBy: admin._id,
      })
      stories1.push(story1)
    } else {
      stories1.push(story1)
    }
    
    let story2 = await Story.findOne({ storyId: 'ECOM-2' })
    if (!story2) {
      story2 = await Story.create({
        title: 'As a customer, I want to save items for later so that I can purchase them later',
        description: 'Add wishlist/save for later functionality',
        storyId: 'ECOM-2',
        project: project1._id,
        feature: feature1._id,
        sprint: sprint1._id,
        storyPoints: 3,
        priority: 'medium',
        status: 'ready',
        acceptanceCriteria: [
          'User can click "Save for Later" on any product',
          'Saved items appear in "Wishlist" section',
          'User can move saved items to cart',
        ],
        createdBy: admin._id,
      })
      stories1.push(story2)
    } else {
      stories1.push(story2)
    }
    
    let story3 = await Story.findOne({ storyId: 'ECOM-3' })
    if (!story3) {
      story3 = await Story.create({
        title: 'As a customer, I want to see cart total with taxes so that I know the final price',
        description: 'Calculate and display cart total including taxes and shipping',
        storyId: 'ECOM-3',
        project: project1._id,
        feature: feature1._id,
        sprint: sprint1._id,
        storyPoints: 3,
        priority: 'high',
        status: 'in-progress',
        acceptanceCriteria: [
          'Cart shows subtotal, tax, shipping, and total',
          'Tax calculation based on user location',
          'Shipping cost calculated based on weight/distance',
        ],
        createdBy: admin._id,
      })
      stories1.push(story3)
    } else {
      stories1.push(story3)
    }

    const createdStories1 = stories1
    for (const story of createdStories1) {
      log(`   ✅ Story: ${story.storyId} - ${story.title.substring(0, 50)}...`)
    }

    // Update sprint with stories
    await Sprint.findByIdAndUpdate(sprint1._id, {
      $set: { stories: createdStories1.map(s => s._id) }
    })

    // Tasks for Story 1 (ECOM-1) - In Progress
    const tasks1 = [
      {
        title: 'Create shopping cart API endpoint',
        description: 'Build REST API endpoint to add/remove items from cart',
        story: story1._id,
        assignedTo: developersAlpha[0]?._id || developersAlpha[0],
        status: 'done',
        priority: 'high',
        estimatedHours: 6,
        actualHours: 5.5,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        createdBy: admin._id,
      },
      {
        title: 'Design cart UI component',
        description: 'Create cart sidebar/dropdown component with item list',
        story: story1._id,
        assignedTo: developersAlpha[1]?._id || developersAlpha[1] || developersAlpha[0],
        status: 'done',
        priority: 'high',
        estimatedHours: 8,
        actualHours: 7,
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        createdBy: admin._id,
      },
      {
        title: 'Implement cart item quantity update',
        description: 'Allow users to increase/decrease item quantities',
        story: story1._id,
        assignedTo: developersAlpha[0]?._id || developersAlpha[0],
        status: 'in-progress',
        priority: 'medium',
        estimatedHours: 4,
        createdBy: admin._id,
      },
      {
        title: 'Add remove item from cart functionality',
        description: 'Implement delete/remove item button in cart',
        story: story1._id,
        assignedTo: developersAlpha[1]?._id || developersAlpha[1] || developersAlpha[0],
        status: 'todo',
        priority: 'medium',
        estimatedHours: 3,
        createdBy: admin._id,
      },
    ]

    for (const taskData of tasks1) {
      // Check if task already exists
      const existingTask = await Task.findOne({ 
        story: story1._id, 
        title: taskData.title 
      })
      if (!existingTask) {
        const task = await Task.create(taskData)
        await Story.findByIdAndUpdate(story1._id, {
          $push: { tasks: task._id }
        })
        log(`      ✅ Task: ${task.title} (${task.status})`)
      }
    }

    // Tasks for Story 2 (ECOM-2) - Ready
    const tasks2 = [
      {
        title: 'Create wishlist database schema',
        description: 'Design and implement wishlist data model',
        story: story2._id,
        assignedTo: developersAlpha[0]?._id || developersAlpha[0],
        status: 'todo',
        priority: 'medium',
        estimatedHours: 3,
        createdBy: admin._id,
      },
      {
        title: 'Build wishlist API endpoints',
        description: 'Create API to save/retrieve wishlist items',
        story: story2._id,
        assignedTo: developersAlpha[0]?._id || developersAlpha[0],
        status: 'todo',
        priority: 'medium',
        estimatedHours: 5,
        createdBy: admin._id,
      },
    ]

    for (const taskData of tasks2) {
      const existingTask = await Task.findOne({ 
        story: story2._id, 
        title: taskData.title 
      })
      if (!existingTask) {
        const task = await Task.create(taskData)
        await Story.findByIdAndUpdate(story2._id, {
          $push: { tasks: task._id }
        })
      }
    }

    // Tasks for Story 3 (ECOM-3) - In Progress
    const tasks3 = [
      {
        title: 'Implement tax calculation service',
        description: 'Calculate tax based on user location and product type',
        story: story3._id,
        assignedTo: developersAlpha[1]?._id || developersAlpha[1] || developersAlpha[0],
        status: 'in-progress',
        priority: 'high',
        estimatedHours: 6,
        createdBy: admin._id,
      },
      {
        title: 'Add shipping cost calculator',
        description: 'Calculate shipping based on weight and distance',
        story: story3._id,
        assignedTo: developersAlpha[0]?._id || developersAlpha[0],
        status: 'todo',
        priority: 'high',
        estimatedHours: 4,
        createdBy: admin._id,
      },
    ]

    for (const taskData of tasks3) {
      const existingTask = await Task.findOne({ 
        story: story3._id, 
        title: taskData.title 
      })
      if (!existingTask) {
        const task = await Task.create(taskData)
        await Story.findByIdAndUpdate(story3._id, {
          $push: { tasks: task._id }
        })
      }
    }

    // SPRINT 2 for Project 1 (Planned)
    let sprint2 = await Sprint.findOne({ project: project1._id, name: 'Sprint 2: Checkout & Payment' })
    if (!sprint2) {
      const sprint1End = sprint1.endDate || new Date()
      const sprint2Start = new Date(sprint1End)
      sprint2Start.setDate(sprint2Start.getDate() + 1)
      const sprint2End = new Date(sprint2Start)
      sprint2End.setDate(sprint2End.getDate() + 14)

      sprint2 = await Sprint.create({
        name: 'Sprint 2: Checkout & Payment',
        project: project1._id,
        startDate: sprint2Start,
        endDate: sprint2End,
        status: 'planned',
        goal: 'Implement checkout flow and payment integration',
        createdBy: admin._id,
      })
    }

    if (!await Story.findOne({ storyId: 'ECOM-4' })) {
      await Story.create({
        title: 'As a customer, I want to checkout securely so that I can complete my purchase',
        description: 'Build secure checkout page with address and payment form',
        storyId: 'ECOM-4',
        project: project1._id,
        feature: feature1._id,
        sprint: sprint2._id,
        storyPoints: 8,
        priority: 'high',
        status: 'backlog',
        acceptanceCriteria: [
          'Checkout page shows cart summary',
          'User can enter shipping address',
          'User can select payment method',
          'Form validation prevents errors',
        ],
        createdBy: admin._id,
      })
    }

    if (!await Story.findOne({ storyId: 'ECOM-5' })) {
      await Story.create({
        title: 'As a customer, I want to pay with credit card so that I can purchase items',
        description: 'Integrate payment gateway (Stripe) for credit card processing',
        storyId: 'ECOM-5',
        project: project1._id,
        feature: feature1._id,
        sprint: sprint2._id,
        storyPoints: 13,
        priority: 'high',
        status: 'backlog',
        acceptanceCriteria: [
          'Payment form accepts card details securely',
          'Integration with Stripe payment gateway',
          'Handle payment success/failure scenarios',
          'Send order confirmation email',
        ],
        createdBy: admin._id,
      })
    }

    log(`\n📦 Creating Project 2: Mobile App`)
    log(`   Team: ${teamBeta.name}`)
    log(`   Developers: ${developersBeta.length}`)

    // Check if project already exists
    let project2 = await Project.findOne({ key: 'MOBILE' })
    if (!project2) {
      project2 = await Project.create({
        name: 'Mobile App',
        key: 'MOBILE',
        description: 'Native mobile application for iOS and Android with user authentication and profile management',
        organization: organization._id,
        team: teamBeta._id,
        status: 'active',
        priority: 'high',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-08-31'),
        createdBy: admin._id,
      })
      log(`✅ Created project: ${project2.name} (${project2.key})`)
    } else {
      log(`✅ Using existing project: ${project2.name} (${project2.key})`)
    }

    // Feature for Project 2
    let feature2 = await Feature.findOne({ project: project2._id, title: 'User Authentication' })
    if (!feature2) {
      feature2 = await Feature.create({
        title: 'User Authentication',
        description: 'User login, registration, and profile management',
        project: project2._id,
        status: 'in-progress',
        priority: 'high',
        createdBy: admin._id,
      })
    }

    // SPRINT 1 for Project 2 (Active)
    let sprint3 = await Sprint.findOne({ project: project2._id, name: 'Sprint 1: User Login' })
    if (!sprint3) {
      const sprint3Start = new Date()
      sprint3Start.setDate(sprint3Start.getDate() - 5) // Started 5 days ago
      const sprint3End = new Date(sprint3Start)
      sprint3End.setDate(sprint3End.getDate() + 14)

      sprint3 = await Sprint.create({
        name: 'Sprint 1: User Login',
        project: project2._id,
        startDate: sprint3Start,
        endDate: sprint3End,
        status: 'active',
        goal: 'Implement user authentication and login flow',
        createdBy: admin._id,
      })
      log(`✅ Created active sprint: ${sprint3.name}`)
    } else {
      log(`✅ Using existing sprint: ${sprint3.name}`)
    }

    // Stories for Sprint 3
    const createdStories3 = []
    let story4 = await Story.findOne({ storyId: 'MOBILE-1' })
    if (!story4) {
      story4 = await Story.create({
        title: 'As a user, I want to login with email and password so that I can access my account',
        description: 'Build login screen with email/password authentication',
        storyId: 'MOBILE-1',
        project: project2._id,
        feature: feature2._id,
        sprint: sprint3._id,
        storyPoints: 5,
        priority: 'high',
        status: 'in-progress',
        acceptanceCriteria: [
          'Login screen with email and password fields',
          'Form validation for email format',
          'Error handling for invalid credentials',
          'Navigate to home screen on success',
        ],
        createdBy: admin._id,
      })
      createdStories3.push(story4)
    } else {
      createdStories3.push(story4)
    }
    
    let story5 = await Story.findOne({ storyId: 'MOBILE-2' })
    if (!story5) {
      story5 = await Story.create({
        title: 'As a user, I want to register a new account so that I can use the app',
        description: 'Create registration flow with email verification',
        storyId: 'MOBILE-2',
        project: project2._id,
        feature: feature2._id,
        sprint: sprint3._id,
        storyPoints: 8,
        priority: 'high',
        status: 'ready',
        acceptanceCriteria: [
          'Registration form with name, email, password',
          'Password strength validation',
          'Email verification sent after registration',
          'User can verify email and complete registration',
        ],
        createdBy: admin._id,
      })
      createdStories3.push(story5)
    } else {
      createdStories3.push(story5)
    }
    
    let story6 = await Story.findOne({ storyId: 'MOBILE-3' })
    if (!story6) {
      story6 = await Story.create({
        title: 'As a user, I want to reset my password so that I can regain access',
        description: 'Implement forgot password flow with email reset link',
        storyId: 'MOBILE-3',
        project: project2._id,
        feature: feature2._id,
        sprint: sprint3._id,
        storyPoints: 5,
        priority: 'medium',
        status: 'backlog',
        acceptanceCriteria: [
          'Forgot password screen',
          'Send reset link to email',
          'Reset password page with token validation',
          'User can set new password',
        ],
        createdBy: admin._id,
      })
      createdStories3.push(story6)
    } else {
      createdStories3.push(story6)
    }

    for (const story of createdStories3) {
      log(`   ✅ Story: ${story.storyId} - ${story.title.substring(0, 50)}...`)
    }

    await Sprint.findByIdAndUpdate(sprint3._id, {
      $set: { stories: createdStories3.map(s => s._id) }
    })

    // Tasks for Story MOBILE-1
    const tasks4 = [
      {
        title: 'Design login screen UI',
        description: 'Create login screen layout with email and password fields',
        story: story4._id,
        assignedTo: developersBeta[0]?._id || developersBeta[0],
        status: 'done',
        priority: 'high',
        estimatedHours: 6,
        actualHours: 5,
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        createdBy: admin._id,
      },
      {
        title: 'Implement login API integration',
        description: 'Connect login form to backend authentication API',
        story: story4._id,
        assignedTo: developersBeta[1]?._id || developersBeta[1] || developersBeta[0],
        status: 'done',
        priority: 'high',
        estimatedHours: 4,
        actualHours: 4.5,
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdBy: admin._id,
      },
      {
        title: 'Add form validation and error handling',
        description: 'Validate email format and show error messages',
        story: story4._id,
        assignedTo: developersBeta[0]?._id || developersBeta[0],
        status: 'in-progress',
        priority: 'medium',
        estimatedHours: 3,
        createdBy: admin._id,
      },
    ]

    for (const taskData of tasks4) {
      const existingTask = await Task.findOne({ 
        story: story4._id, 
        title: taskData.title 
      })
      if (!existingTask) {
        const task = await Task.create(taskData)
        await Story.findByIdAndUpdate(story4._id, {
          $push: { tasks: task._id }
        })
        log(`      ✅ Task: ${task.title} (${task.status})`)
      }
    }

    // Tasks for Story MOBILE-2
    const tasks5 = [
      {
        title: 'Create registration screen',
        description: 'Design registration form UI',
        story: story5._id,
        assignedTo: developersBeta[1]?._id || developersBeta[1] || developersBeta[0],
        status: 'todo',
        priority: 'high',
        estimatedHours: 5,
        createdBy: admin._id,
      },
      {
        title: 'Implement password strength indicator',
        description: 'Show password strength as user types',
        story: story5._id,
        assignedTo: developersBeta[0]?._id || developersBeta[0],
        status: 'todo',
        priority: 'medium',
        estimatedHours: 3,
        createdBy: admin._id,
      },
    ]

    for (const taskData of tasks5) {
      const existingTask = await Task.findOne({ 
        story: story5._id, 
        title: taskData.title 
      })
      if (!existingTask) {
        const task = await Task.create(taskData)
        await Story.findByIdAndUpdate(story5._id, {
          $push: { tasks: task._id }
        })
      }
    }

    log(`\n✅ Successfully created 2 complete projects!`)
    log(`\n📊 Summary:`)
    log(`   Project 1 (${project1.key}): ${createdStories1.length} stories, ${tasks1.length + tasks2.length + tasks3.length} tasks`)
    log(`   Project 2 (${project2.key}): ${createdStories3.length} stories, ${tasks4.length + tasks5.length} tasks`)
    log(`\n💡 How to use:`)
    log(`   1. Go to Projects page - you'll see both projects`)
    log(`   2. Click on a project to see stories and tasks`)
    log(`   3. Go to Board page to see Kanban board`)
    log(`   4. Developers can mark tasks as done to earn story points`)
    log(`   5. Dashboard will show real-time updates`)

    process.exit(0)
  } catch (error) {
    console.error('Error seeding projects:', error)
    process.exit(1)
  }
}

seedCompleteProjects()

