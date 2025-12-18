/**
 * Fix Double-Hashed Passwords
 * 
 * This script fixes users whose passwords were double-hashed due to the pre-save hook
 * running on already-hashed passwords.
 * 
 * Run: node src/scripts/fixPasswords.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import connectDB from '../config/database.js'
import { User } from '../models/index.js'
import { hashPassword } from '../services/auth.service.js'

dotenv.config()

// Test passwords for each role
const testPasswords = {
  admin: 'Admin@123',
  manager: 'Manager@123',
  developer: 'Developer@123',
  viewer: 'Viewer@123',
}

/**
 * Check if a string is a bcrypt hash
 */
function isBcryptHash(str) {
  return /^\$2[ayb]\$.{56}$/.test(str)
}

/**
 * Attempt to verify password against a hash
 * Returns true if it's a valid hash and matches, false otherwise
 */
async function verifyPassword(password, hash) {
  if (!isBcryptHash(hash)) {
    return false
  }
  
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    return false
  }
}

/**
 * Fix user passwords
 */
async function fixPasswords() {
  try {
    console.log('🔧 Connecting to database...')
    await connectDB()
    
    console.log('🔍 Finding users with potentially double-hashed passwords...\n')
    
    const users = await User.find({}).select('+password')
    let fixedCount = 0
    let skippedCount = 0
    
    for (const user of users) {
      if (!user.password) {
        console.log(`⚠️  User ${user.email} has no password - skipping`)
        skippedCount++
        continue
      }
      
      // Check if password is already a valid bcrypt hash
      if (!isBcryptHash(user.password)) {
        console.log(`⚠️  User ${user.email} has invalid password format - skipping`)
        skippedCount++
        continue
      }
      
      // Try to verify with known test passwords
      let passwordToUse = null
      for (const [role, testPassword] of Object.entries(testPasswords)) {
        const matches = await verifyPassword(testPassword, user.password)
        if (matches) {
          // Password is correct, no need to fix
          console.log(`✓ User ${user.email} (${user.role}) - password is correct`)
          skippedCount++
          passwordToUse = null
          break
        }
      }
      
      // If password doesn't match any test password, try to fix it
      if (passwordToUse === null && user.role in testPasswords) {
        // Try to verify if it's double-hashed by checking against the test password
        // If it's double-hashed, we need to re-hash the original password
        const testPassword = testPasswords[user.role]
        
        // Check if it's double-hashed (unlikely to match, but let's try)
        // Actually, if it doesn't match, it might be double-hashed or wrong password
        // For safety, we'll only fix if we're sure it's a seeded user
        const seededEmails = [
          'admin@agilesafe.com',
          'manager1@agilesafe.com',
          'manager2@agilesafe.com',
          'alice@agilesafe.com',
          'bob@agilesafe.com',
          'charlie@agilesafe.com',
          'diana@agilesafe.com',
          'eve@agilesafe.com',
          'frank@agilesafe.com',
          'grace@agilesafe.com',
          'henry@agilesafe.com',
          'ivy@agilesafe.com',
          'jack@agilesafe.com',
          'viewer1@agilesafe.com',
          'viewer2@agilesafe.com',
        ]
        
        if (seededEmails.includes(user.email.toLowerCase())) {
          // This is a seeded user, fix the password
          const newHash = await hashPassword(testPassword)
          user.password = newHash
          await user.save()
          console.log(`🔧 Fixed password for ${user.email} (${user.role})`)
          fixedCount++
        } else {
          console.log(`⚠️  User ${user.email} - password doesn't match test passwords, but not a seeded user - skipping`)
          skippedCount++
        }
      }
    }
    
    console.log(`\n✅ Fixed ${fixedCount} passwords`)
    console.log(`⏭️  Skipped ${skippedCount} users`)
    console.log('\n💡 Recommendation: Re-run seed script to ensure all passwords are correct:')
    console.log('   npm run seed:force')
    
    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error fixing passwords:', error)
    process.exit(1)
  }
}

// Run the fix
fixPasswords()

