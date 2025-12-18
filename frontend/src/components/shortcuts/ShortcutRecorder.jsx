import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Button from '@/components/ui/Button'
import { eventToCombo, normalizeCombo } from '@/utils/shortcuts'
import { ShortcutPill } from './ShortcutHelpModal'

export default function ShortcutRecorder({ value, onChange }) {
  const [isRecording, setIsRecording] = useState(false)

  useEffect(() => {
    if (!isRecording) return

    const handleKeydown = (event) => {
      event.preventDefault()
      if (event.key === 'Escape') {
        setIsRecording(false)
        return
      }
      const combo = normalizeCombo(eventToCombo(event))
      if (!combo) return
      onChange(combo)
      setIsRecording(false)
    }

    window.addEventListener('keydown', handleKeydown, true)
    return () => window.removeEventListener('keydown', handleKeydown, true)
  }, [isRecording, onChange])

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-[120px]">
        {value ? (
          <ShortcutPill combo={value} />
        ) : (
          <span className="text-xs text-muted">Not bound</span>
        )}
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setIsRecording(true)}
        disabled={isRecording}
      >
        {isRecording ? 'Press keys…' : 'Rebind'}
      </Button>
      {value && (
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange('')}>
          Clear
        </Button>
      )}
    </div>
  )
}

ShortcutRecorder.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
}

