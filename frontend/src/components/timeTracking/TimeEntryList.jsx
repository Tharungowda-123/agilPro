import { Edit, Trash2 } from 'lucide-react'
import { useTimeEntriesForTask, useUpdateTimeEntry, useDeleteTimeEntry } from '@/hooks/api/useTimeEntries'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { useState } from 'react'
import { cn } from '@/utils'

/**
 * Time Entry List Component
 * Displays time entries for a task with edit/delete functionality
 */
export default function TimeEntryList({ taskId }) {
  const { data: timeEntriesData, isLoading } = useTimeEntriesForTask(taskId)
  const updateTimeEntry = useUpdateTimeEntry()
  const deleteTimeEntry = useDeleteTimeEntry()
  const [editingEntry, setEditingEntry] = useState(null)
  const [editForm, setEditForm] = useState({ hours: '', date: '', description: '' })

  const timeEntries = timeEntriesData?.data || timeEntriesData || []

  const handleEdit = (entry) => {
    setEditingEntry(entry)
    setEditForm({
      hours: entry.hours.toString(),
      date: new Date(entry.date).toISOString().split('T')[0],
      description: entry.description || '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editingEntry) return

    try {
      await updateTimeEntry.mutateAsync({
        id: editingEntry._id,
        hours: parseFloat(editForm.hours),
        date: editForm.date,
        description: editForm.description.trim() || undefined,
      })
      setEditingEntry(null)
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleDelete = async (entryId) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      try {
        await deleteTimeEntry.mutateAsync(entryId)
      } catch (error) {
        // Error handled by hook
      }
    }
  }

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading time entries...</div>
  }

  return (
    <div className="space-y-2">
      {timeEntries.length === 0 ? (
        <p className="text-sm text-gray-400">No time entries yet</p>
      ) : (
        timeEntries.map((entry) => (
          <div
            key={entry._id || entry.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {entry.hours.toFixed(2)}h
                </span>
                <Badge
                  size="sm"
                  variant={entry.entryType === 'timer' ? 'primary' : 'outlined'}
                >
                  {entry.entryType === 'timer' ? 'Timer' : 'Manual'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                {new Date(entry.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {entry.description && ` • ${entry.description}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outlined"
                size="sm"
                onClick={() => handleEdit(entry)}
                leftIcon={<Edit className="w-3 h-3" />}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                size="sm"
                onClick={() => handleDelete(entry._id || entry.id)}
                leftIcon={<Trash2 className="w-3 h-3" />}
                className="text-error-600 hover:bg-error-50"
              >
                Delete
              </Button>
            </div>
          </div>
        ))
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <Modal
          isOpen={!!editingEntry}
          onClose={() => setEditingEntry(null)}
          title="Edit Time Entry"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
              <Input
                type="number"
                step="0.25"
                min="0"
                max="24"
                value={editForm.hours}
                onChange={(e) => setEditForm({ ...editForm, hours: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <Input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Input
                type="text"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Optional"
                maxLength={500}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outlined" onClick={() => setEditingEntry(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveEdit}>
                Save
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

