import { useState } from 'react'
import { Clock } from 'lucide-react'
import { useCreateTimeEntry } from '@/hooks/api/useTimeEntries'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

/**
 * Manual Time Entry Component
 * Form for manually logging time
 */
export default function ManualTimeEntry({ taskId, onTimeLogged }) {
  const [hours, setHours] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const createTimeEntry = useCreateTimeEntry()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!hours || parseFloat(hours) <= 0) {
      return
    }

    try {
      await createTimeEntry.mutateAsync({
        taskId,
        hours: parseFloat(hours),
        date,
        description: description.trim() || undefined,
      })
      setHours('')
      setDescription('')
      if (onTimeLogged) {
        onTimeLogged()
      }
    } catch (error) {
      // Error handled by hook
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="0.25"
          min="0"
          max="24"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="Hours"
          className="w-24"
          required
        />
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1"
        />
        <Input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="flex-1"
          maxLength={500}
        />
        <Button
          type="submit"
          variant="outlined"
          leftIcon={<Clock className="w-4 h-4" />}
          disabled={createTimeEntry.isPending || !hours || parseFloat(hours) <= 0}
        >
          Log Time
        </Button>
      </div>
    </form>
  )
}

