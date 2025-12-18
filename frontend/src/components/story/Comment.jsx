import PropTypes from 'prop-types'
import { useState } from 'react'
import { Edit, Trash2, MoreVertical } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Dropdown from '@/components/ui/Dropdown'
import RichTextEditor from '@/components/editor/RichTextEditor'
import { cn } from '@/utils'

/**
 * Comment Component
 * Reusable comment display with edit/delete functionality
 * 
 * @example
 * <Comment
 *   comment={comment}
 *   currentUserId="1"
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 */
export default function Comment({
  comment,
  currentUserId,
  onEdit,
  onDelete,
  className = '',
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.text)

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now - time) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Highlight @mentions
  const renderCommentText = (text) => {
    const mentionRegex = /@(\w+)/g
    const parts = text.split(mentionRegex)
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a mention
        return (
          <span key={index} className="text-primary-600 font-medium">
            @{part}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  const isOwnComment = comment.userId === currentUserId

  const menuItems = [
    {
      label: 'Edit',
      icon: <Edit className="w-4 h-4" />,
      onClick: () => setIsEditing(true),
    },
    {
      type: 'divider',
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      variant: 'danger',
      onClick: () => onDelete?.(comment.id),
    },
  ]

  const handleSave = () => {
    onEdit?.({ ...comment, text: editText })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditText(comment.text)
    setIsEditing(false)
  }

  return (
    <div className={cn('flex gap-3 pb-4 border-b border-gray-100 last:border-0', className)}>
      <Avatar
        name={comment.userName}
        size="md"
        src={comment.userAvatar}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">{comment.userName}</span>
          {comment.userRole && (
            <Badge variant="outlined" size="sm">
              {comment.userRole}
            </Badge>
          )}
          <span className="text-xs text-gray-500">{formatTimeAgo(comment.timestamp)}</span>
          {comment.edited && (
            <span className="text-xs text-gray-400 italic">(edited)</span>
          )}
          {isOwnComment && (
            <div className="ml-auto">
              <Dropdown
                trigger={
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                }
                items={menuItems}
                position="bottom-right"
              />
            </div>
          )}
        </div>
        {isEditing ? (
          <div className="space-y-2">
            <RichTextEditor
              value={editText}
              onChange={setEditText}
              placeholder="Edit comment..."
              minHeight="100px"
              showMarkdownToggle={false}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className="prose prose-sm max-w-none text-sm text-gray-700"
            dangerouslySetInnerHTML={{ __html: comment.text || comment.content || '' }}
          />
        )}
      </div>
    </div>
  )
}

Comment.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    userName: PropTypes.string.isRequired,
    userAvatar: PropTypes.string,
    userRole: PropTypes.string,
    text: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    edited: PropTypes.bool,
  }).isRequired,
  currentUserId: PropTypes.string,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  className: PropTypes.string,
}

