import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { User } from '../models/index.js'
import logger from '../utils/logger.js'

/**
 * Passport Configuration
 * Google OAuth 2.0 Strategy setup
 */

// Only initialize Google OAuth if credentials are provided
const googleClientID = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

if (
  googleClientID &&
  googleClientSecret &&
  googleClientID !== 'your_google_client_id' &&
  googleClientSecret !== 'your_google_client_secret'
) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientID,
        clientSecret: googleClientSecret,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Find user by Google ID
          let user = await User.findOne({ googleId: profile.id })

          if (user) {
            return done(null, user)
          }

          // Find user by email and link Google account
          user = await User.findOne({ email: profile.emails[0].value })

          if (user) {
            user.googleId = profile.id
            if (!user.avatar && profile.photos[0]?.value) {
              user.avatar = profile.photos[0].value
            }
            await user.save()
            return done(null, user)
          }

          // Create new user
          user = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            avatar: profile.photos[0]?.value,
            role: 'developer', // Default role
            isEmailVerified: true, // Google emails are verified
          })

          await user.save()
          logger.info(`New user created via Google OAuth: ${user.email}`)
          done(null, user)
        } catch (error) {
          logger.error('Passport Google strategy error:', error)
          done(error, null)
        }
      }
    )
  )
  logger.info('Google OAuth strategy initialized')
} else {
  logger.warn('Google OAuth not configured - skipping Google OAuth strategy initialization')
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id)
})

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password')
    done(null, user)
  } catch (error) {
    logger.error('Passport deserialize error:', error)
    done(error, null)
  }
})

export default passport


