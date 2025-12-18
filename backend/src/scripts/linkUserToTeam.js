import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import connectDB from '../config/database.js'
import User from '../models/User.js'
import Team from '../models/Team.js'

dotenv.config()

async function main() {
  try {
    const emailArg = process.argv.find((a) => a.startsWith('--email='))
    const email = (emailArg && emailArg.split('=')[1]) || process.env.LINK_EMAIL
    const teamName = process.env.LINK_TEAM_NAME || 'Team Alpha'

    if (!email) {
      console.error('Usage: node src/scripts/linkUserToTeam.js --email=USER_EMAIL')
      process.exit(1)
    }

    await connectDB()

    let user = await User.findOne({ email })
    if (!user) {
      console.log(`User not found for email: ${email}. Creating a new developer user...`)
      const hash = await bcrypt.hash(process.env.LINK_PASSWORD || 'Demo@123', 10)
      user = await User.create({
        name: email.split('@')[0],
        email,
        password: hash,
        role: 'developer',
        isActive: true,
        isEmailVerified: true,
      })
      console.log(`✅ Created user ${email} with password ${process.env.LINK_PASSWORD || 'Demo@123'}`)
    }

    const team = await Team.findOne({ name: teamName })
    if (!team) {
      console.error(`Team not found: ${teamName}. Please run the seed first or create the team.`)
      process.exit(1)
    }

    // Link user to team
    user.team = team._id
    await user.save()

    // Ensure membership contains the user
    if (!team.members.map((m) => m.toString()).includes(user._id.toString())) {
      team.members.push(user._id)
      await team.save()
    }

    console.log(`✅ Linked ${user.email} to team "${team.name}"`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Error linking user to team:', err.message)
    process.exit(1)
  }
}

main()


