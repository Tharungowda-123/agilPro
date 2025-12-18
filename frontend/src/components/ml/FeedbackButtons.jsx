import { useState } from 'react'
import { ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Button from '@/components/ui/Button'
import { submitMLFeedback } from '@/services/api/mlFeedbackService'

/**
 * ML Feedback Buttons Component
 * Allows users to provide feedback on AI recommendations
 */
export default function MLFeedbackButtons({ prediction, predictionType, onFeedback, className }) {
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFeedback = async (wasHelpful) => {
    if (submitted || isSubmitting) return

    setIsSubmitting(true)
    try {
      await submitMLFeedback({
        modelType: predictionType,
        predictionId: prediction?.id || prediction?._id || `prediction-${Date.now()}`,
        prediction: prediction?.prediction || prediction,
        feedback: {
          wasAccurate: wasHelpful,
          userRating: wasHelpful ? 5 : 1,
          acceptedByUser: wasHelpful,
        },
      })

      setSubmitted(true)
      onFeedback?.(wasHelpful)

      toast.success(
        wasHelpful
          ? 'Thanks! This helps improve our AI 🤖'
          : 'Thanks for the feedback. We\'ll improve! 📈'
      )
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      toast.error('Failed to submit feedback. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <CheckCircle className="w-4 h-4" />
        <span>Feedback received</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <span className="text-sm text-gray-600 dark:text-gray-400">Was this helpful?</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleFeedback(true)}
          disabled={isSubmitting}
          className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Yes, helpful"
          aria-label="Mark as helpful"
        >
          <ThumbsUp className="w-4 h-4 text-green-600 dark:text-green-400" />
        </button>
        <button
          onClick={() => handleFeedback(false)}
          disabled={isSubmitting}
          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="No, not helpful"
          aria-label="Mark as not helpful"
        >
          <ThumbsDown className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      </div>
    </div>
  )
}

