/**
 * Password Strength Utility
 * Calculates password strength and returns level and feedback
 */

export const getPasswordStrength = (password) => {
  if (!password) return { level: 0, label: '', color: '' }

  let strength = 0
  const feedback = []

  // Length check
  if (password.length >= 8) {
    strength += 1
  } else {
    feedback.push('At least 8 characters')
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    strength += 1
  } else {
    feedback.push('One uppercase letter')
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    strength += 1
  } else {
    feedback.push('One lowercase letter')
  }

  // Number check
  if (/[0-9]/.test(password)) {
    strength += 1
  } else {
    feedback.push('One number')
  }

  // Special character check
  if (/[^A-Za-z0-9]/.test(password)) {
    strength += 1
  } else {
    feedback.push('One special character')
  }

  const levels = [
    { label: 'Weak', color: 'error' },
    { label: 'Weak', color: 'error' },
    { label: 'Medium', color: 'warning' },
    { label: 'Medium', color: 'warning' },
    { label: 'Strong', color: 'success' },
    { label: 'Very Strong', color: 'success' },
  ]

  const result = levels[strength] || levels[0]

  return {
    level: strength,
    label: result.label,
    color: result.color,
    feedback: feedback.length > 0 ? feedback : [],
  }
}

