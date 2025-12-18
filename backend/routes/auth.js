import express from 'express'
import jwt from 'jsonwebtoken'
import passport from 'passport'
import User from '../models/User.js'
import { authenticateToken } from '../middleware/auth.js'
import { validate, schemas } from '../middleware/validation.js'
import logger from '../utils/logger.js'

const router = express.Router()

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d',
  })
}

// Register
router.post('/register', validate(schemas.login), async (req, res) => {
  try {
    const { email, password, name } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const user = new User({ email, password, name })
    await user.save()

    const token = generateToken(user._id)

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    logger.error('Registration error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Login
router.post('/login', validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = generateToken(user._id)

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    logger.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json({ user })
  } catch (error) {
    logger.error('Get user error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const token = generateToken(req.user._id)
      res.redirect(
        `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/auth/callback?token=${token}`
      )
    } catch (error) {
      logger.error('Google OAuth error:', error)
      res.redirect(
        `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/login?error=oauth_failed`
      )
    }
  }
)

export default router

