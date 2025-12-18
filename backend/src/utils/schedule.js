export const calculateNextRunAt = (schedule = {}) => {
  const now = new Date()
  const [hour = 9, minute = 0] = (schedule.timeOfDay || '09:00')
    .split(':')
    .map((value) => parseInt(value, 10))

  const next = new Date(now)
  next.setSeconds(0, 0)
  next.setHours(hour, minute, 0, 0)

  if (next <= now) {
    next.setDate(next.getDate() + 1)
  }

  switch (schedule.frequency) {
    case 'daily':
      return next
    case 'weekly': {
      const targetDay = schedule.dayOfWeek ?? 1 // Monday default
      const diff = (targetDay + 7 - next.getDay()) % 7 || 7
      next.setDate(next.getDate() + diff)
      return next
    }
    case 'monthly': {
      const targetDate = schedule.dayOfMonth ?? 1
      next.setDate(targetDate)
      if (next <= now) {
        next.setMonth(next.getMonth() + 1)
        next.setDate(targetDate)
      }
      return next
    }
    default:
      return next
  }
}


