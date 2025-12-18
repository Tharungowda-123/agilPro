import dotenv from 'dotenv'
import mongoose from 'mongoose'
import connectDB from '../config/database.js'
import { Team, Project, Sprint, Story, User } from '../models/index.js'

dotenv.config()

const log = (...args) => console.log('[seed-velocity]', ...args)

function parseArgs() {
  const args = process.argv.slice(2)
  const result = {}
  for (const a of args) {
    const [k, v] = a.split('=')
    if (k && v) result[k.replace(/^--/, '')] = v
  }
  return result
}

async function ensureProjectForTeam(teamId) {
  let project = await Project.findOne({ team: teamId })
  if (project) return project
  // Create a lightweight project if none exists
  project = await Project.create({
    name: 'Velocity Seed Project',
    key: 'VELSEED',
    description: 'Auto-generated for velocity seeding',
    team: teamId,
    status: 'active',
    priority: 'medium',
    startDate: new Date(Date.now() - 120 * 86400000),
  })
  return project
}

function backdate(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

async function createCompletedSprint(projectId, sprintNumber, startDate, endDate, velocity, committedPoints) {
  const sprint = await Sprint.create({
    name: `Seed Sprint ${sprintNumber}`,
    sprintNumber,
    project: projectId,
    goal: 'Seeded historical sprint',
    startDate,
    endDate,
    status: 'completed',
    capacity: committedPoints || velocity + 10,
    committedPoints: committedPoints || velocity + 5,
    completedPoints: velocity,
    velocity,
  })
  return sprint
}

async function seedVelocityHistory(teamId, count = 4) {
  const team = await Team.findById(teamId)
  if (!team) {
    throw new Error(`Team not found: ${teamId}`)
  }
  const project = await ensureProjectForTeam(teamId)

  // Create a simple set of completed sprints over past weeks
  const baseVel = 40
  const created = []
  for (let i = count; i >= 1; i -= 1) {
    const sprintLen = 14
    const endDaysAgo = (i * sprintLen) + 1
    const endDate = backdate(endDaysAgo)
    const startDate = backdate(endDaysAgo + sprintLen)
    const jitter = Math.floor(Math.random() * 12) - 6
    const velocity = Math.max(15, baseVel + jitter)
    // committed points close to velocity
    const committed = velocity + Math.floor(Math.random() * 6) - 3
    const sprint = await createCompletedSprint(project._id, 100 + (count - i + 1), startDate, endDate, velocity, committed)
    created.push(sprint)
  }
  return created
}

async function main() {
  const args = parseArgs()
  const teamId = args.team || args['team-id']
  const count = parseInt(args.count || '4', 10)
  if (!teamId) {
    console.error('Usage: node src/scripts/seedVelocityHistory.js --team=<TEAM_ID> [--count=4]')
    process.exit(1)
  }
  await connectDB()
  log('Connected to MongoDB')
  try {
    const sprints = await seedVelocityHistory(teamId, count)
    log(`Created ${sprints.length} completed sprints for team ${teamId}`)
  } catch (e) {
    console.error(e)
    process.exitCode = 1
  } finally {
    await mongoose.connection.close()
    log('Connection closed')
  }
}

main()



