import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { formatDistanceToNow } from 'date-fns'
import {
  MessageSquarePlus,
  CornerDownRight,
  MoreVertical,
  Edit3,
  Trash2,
  CheckCircle2,
  Pin,
  Clock4,
} from 'lucide-react'
import RichTextEditor from '@/components/editor/RichTextEditor'
import FormGroup from '@/components/ui/FormGroup'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/utils'
import { useAuthStore } from '@/stores/useAuthStore'
import { useShortcutAction } from '@/context/ShortcutContext'
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useAddReaction,
  useRemoveReaction,
  useResolveCommentThread,
  usePinComment,
} from '@/hooks/api/useComments'

const REACTIONS = ['👍', '❤️', '😂', '🎉']

const getUserId = (user) => user?._id || user?.id || user?.userId || null

const userCanModerate = (currentUser, commentUserId) => {
  if (!currentUser) return false
  if (currentUser.role === 'admin' || currentUser.role === 'manager') return true
  const viewerId = getUserId(currentUser)
  return commentUserId === viewerId
}

const ThreadBadge = ({ type }) => {
  if (type === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        Resolved
      </span>
    )
  }

  if (type === 'pinned') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
        <Pin className="w-3 h-3" />
        Pinned
      </span>
    )
  }

  return null
}

ThreadBadge.propTypes = {
  type: PropTypes.oneOf(['resolved', 'pinned']).isRequired,
}

function ReactionBar({ comment, onToggleReaction, entityType, entityId }) {
  const viewerReactions = comment.reactions || []

  return (
    <div className="flex items-center gap-2 mt-2">
      {REACTIONS.map((emoji) => {
        const reaction = viewerReactions.find((r) => r.emoji === emoji)
        const reacted = reaction?.reacted
        const count = reaction?.count || 0
        return (
          <button
            key={emoji}
            type="button"
            onClick={() =>
              onToggleReaction({
                commentId: comment.id,
                emoji,
                reacted,
                entityType,
                entityId,
              })
            }
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs border',
              reacted
                ? 'bg-primary-50 text-primary-600 border-primary-200'
                : 'text-gray-500 border-gray-200 hover:bg-gray-50'
            )}
          >
            <span>{emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        )
      })}
    </div>
  )
}

ReactionBar.propTypes = {
  comment: PropTypes.object.isRequired,
  onToggleReaction: PropTypes.func.isRequired,
  entityType: PropTypes.string.isRequired,
  entityId: PropTypes.string.isRequired,
}

function CommentCard({
  comment,
  entityType,
  entityId,
  currentUser,
  onEdit,
  onDelete,
  onReply,
  onToggleReaction,
  isRoot = false,
  canResolve = false,
  canPin = false,
  onResolve,
  onPin,
  resolved,
  pinned,
  mentionUsers = [],
  forceEditRequest = null,
  threadId = null,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState(comment.content || '')
  const [isReplying, setIsReplying] = useState(false)
  const [replyDraft, setReplyDraft] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const canEdit = userCanModerate(currentUser, comment.user?.id)

  useEffect(() => {
    if (
      forceEditRequest &&
      forceEditRequest.threadId &&
      threadId &&
      forceEditRequest.threadId === threadId &&
      canEdit
    ) {
      setIsEditing(true)
      setEditDraft(comment.content || '')
    }
  }, [forceEditRequest, threadId, comment.content, canEdit])

  const menuItems = canEdit
    ? [
        {
          label: 'Edit',
          icon: <Edit3 className="w-4 h-4" />,
          onClick: () => {
            setIsEditing(true)
          },
        },
        {
          label: 'Delete',
          icon: <Trash2 className="w-4 h-4" />,
          variant: 'danger',
          onClick: () => onDelete(comment.id),
        },
      ]
    : []

  const handleSaveEdit = () => {
    if (!editDraft.trim()) return
    onEdit(comment.id, editDraft)
    setIsEditing(false)
  }

  const handleReplySubmit = () => {
    if (!replyDraft.trim()) return
    onReply(comment.id, replyDraft)
    setReplyDraft('')
    setIsReplying(false)
  }

  const timestampLabel = comment.createdAt
    ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
    : 'Just now'

  return (
    <div className="flex gap-3">
      <Avatar name={comment.user?.name} src={comment.user?.avatar} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-sm font-medium text-gray-900">{comment.user?.name || 'Unknown User'}</p>
            <p className="text-xs text-gray-500">{timestampLabel}</p>
          </div>
          {comment.isEdited && (
            <span className="text-xs text-gray-400 italic">(edited)</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {isRoot && resolved && <ThreadBadge type="resolved" />}
            {pinned && <ThreadBadge type="pinned" />}
            {canEdit && (
              <Dropdown
                trigger={
                  <button className="p-1 hover:bg-gray-100 rounded-md">
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                }
                items={menuItems}
                position="bottom-right"
              />
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2 mt-2">
            <RichTextEditor
              value={editDraft}
              onChange={setEditDraft}
              minHeight="120px"
              users={mentionUsers}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={handleSaveEdit}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  setEditDraft(comment.content)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="prose prose-sm max-w-none text-sm text-gray-700 mt-2"
            dangerouslySetInnerHTML={{ __html: comment.content || '' }}
          />
        )}

        {comment.editHistory?.length > 0 && (
          <button
            type="button"
            className="mt-2 text-xs text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
            onClick={() => setShowHistory((prev) => !prev)}
          >
            <Clock4 className="w-3 h-3" />
            {showHistory ? 'Hide history' : 'View history'}
          </button>
        )}

        {showHistory && comment.editHistory?.length > 0 && (
          <div className="mt-2 bg-gray-50 border border-gray-100 rounded-md p-3 space-y-2 text-xs text-gray-600">
            {comment.editHistory.map((history, index) => (
              <div key={index}>
                <p className="font-medium">
                  {formatDistanceToNow(new Date(history.editedAt), { addSuffix: true })}
                </p>
                <div
                  className="prose prose-xs max-w-none"
                  dangerouslySetInnerHTML={{ __html: history.content }}
                />
              </div>
            ))}
          </div>
        )}

        <ReactionBar
          comment={comment}
          entityType={entityType}
          entityId={entityId}
          onToggleReaction={onToggleReaction}
        />

        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
          <button
            type="button"
            onClick={() => setIsReplying((prev) => !prev)}
            className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
          >
            <CornerDownRight className="w-3 h-3" />
            Reply
          </button>
          {isRoot && canResolve && (
            <button
              type="button"
              onClick={() => onResolve(comment.id, !resolved)}
              className="inline-flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              {resolved ? 'Unresolve thread' : 'Resolve thread'}
            </button>
          )}
          {isRoot && canPin && (
            <button
              type="button"
              onClick={() => onPin(comment.id, !pinned)}
              className="inline-flex items-center gap-1"
            >
              <Pin className="w-3 h-3" />
              {pinned ? 'Unpin comment' : 'Pin comment'}
            </button>
          )}
        </div>

        {isReplying && (
          <div className="mt-3">
            <RichTextEditor
              value={replyDraft}
              onChange={setReplyDraft}
              minHeight="100px"
              placeholder="Reply to this comment..."
              users={mentionUsers}
            />
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="primary" onClick={handleReplySubmit} disabled={!replyDraft.trim()}>
                Post Reply
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsReplying(false)
                  setReplyDraft('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

CommentCard.propTypes = {
  comment: PropTypes.object.isRequired,
  entityType: PropTypes.string.isRequired,
  entityId: PropTypes.string.isRequired,
  currentUser: PropTypes.object,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onReply: PropTypes.func.isRequired,
  onToggleReaction: PropTypes.func.isRequired,
  isRoot: PropTypes.bool,
  canResolve: PropTypes.bool,
  canPin: PropTypes.bool,
  onResolve: PropTypes.func,
  onPin: PropTypes.func,
  resolved: PropTypes.bool,
  pinned: PropTypes.bool,
  mentionUsers: PropTypes.array,
  forceEditRequest: PropTypes.object,
  threadId: PropTypes.string,
}

export default function ThreadedCommentsSection({
  entityType,
  entityId,
  users = [],
  enableShortcuts = false,
}) {
  const { user } = useAuthStore()
  const { data: threads = [], isLoading } = useComments(entityType, entityId)

  const createComment = useCreateComment()
  const updateComment = useUpdateComment()
  const deleteComment = useDeleteComment()
  const addReaction = useAddReaction()
  const removeReaction = useRemoveReaction()
  const resolveThread = useResolveCommentThread()
  const pinComment = usePinComment()

  const [newComment, setNewComment] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [focusComposerSignal, setFocusComposerSignal] = useState(0)
  const [forcedEdit, setForcedEdit] = useState({ threadId: null, token: 0 })
  const threadRefs = useRef({})

  const handlePostComment = () => {
    if (!newComment.trim()) return
    createComment.mutate(
      {
        entityType,
        entityId,
        content: newComment,
      },
      {
        onSuccess: () => setNewComment(''),
      }
    )
  }

  const handleEdit = (commentId, content) => {
    updateComment.mutate({ id: commentId, content, entityType, entityId })
  }

  const handleDelete = (commentId) => {
    deleteComment.mutate({ id: commentId, entityType, entityId })
  }

  const handleReply = (parentCommentId, content) => {
    createComment.mutate({
      entityType,
      entityId,
      content,
      parentCommentId,
    })
  }

  const handleReactionToggle = ({ commentId, emoji, reacted }) => {
    if (reacted) {
      removeReaction.mutate({ commentId, emoji, entityType, entityId })
    } else {
      addReaction.mutate({ commentId, emoji, entityType, entityId })
    }
  }

  const handleResolve = (commentId, resolved) => {
    resolveThread.mutate({ commentId, resolved, entityType, entityId })
  }

  const handlePin = (commentId, pinned) => {
    pinComment.mutate({ commentId, pinned, entityType, entityId })
  }

  useEffect(() => {
    threadRefs.current = {}
    if (enableShortcuts && threads.length > 0) {
      setActiveIndex((prev) => {
        if (prev >= threads.length) {
          return threads.length - 1
        }
        return prev
      })
    }
  }, [threads, enableShortcuts])

  useEffect(() => {
    if (!enableShortcuts) return
    const activeThread = threads[activeIndex]
    if (!activeThread) return
    const node = threadRefs.current[activeThread.threadId]
    if (node) {
      node.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [activeIndex, threads, enableShortcuts])

  const activeThread = threads[activeIndex]
  const canModifyActive = user && activeThread?.root?.user && userCanModerate(user, activeThread.root.user?.id)

  useShortcutAction(
    'item.next',
    () => {
      setActiveIndex((prev) => Math.min(prev + 1, threads.length - 1))
    },
    { enabled: enableShortcuts && threads.length > 1 }
  )

  useShortcutAction(
    'item.previous',
    () => {
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    },
    { enabled: enableShortcuts && threads.length > 0 }
  )

  useShortcutAction(
    'item.comment',
    () => {
      setFocusComposerSignal((prev) => prev + 1)
    },
    { enabled: enableShortcuts }
  )

  useShortcutAction(
    'item.edit',
    () => {
      if (enableShortcuts && canModifyActive && activeThread) {
        setForcedEdit({ threadId: activeThread.threadId, token: Date.now() })
      }
    },
    { enabled: enableShortcuts && !!activeThread }
  )

  useEffect(() => {
    if (!forcedEdit.threadId) return
    const timer = setTimeout(() => {
      setForcedEdit({ threadId: null, token: 0 })
    }, 500)
    return () => clearTimeout(timer)
  }, [forcedEdit])

  useShortcutAction(
    'item.delete',
    () => {
      if (enableShortcuts && canModifyActive && activeThread) {
        handleDelete(activeThread.root?.id)
      }
    },
    { enabled: enableShortcuts && !!activeThread }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5" />
            Comment Threads
          </h3>
          <span className="text-sm text-gray-500">{threads.length} thread(s)</span>
        </div>

        {threads.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500">No comments yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-5">
            {threads.map((thread, index) => {
              const isActive = enableShortcuts && index === activeIndex
              return (
                <div
                  key={thread.threadId}
                  ref={(node) => {
                    if (node) {
                      threadRefs.current[thread.threadId] = node
                    }
                  }}
                  className={cn(
                    'border border-gray-200 rounded-lg p-4 space-y-4 transition-colors duration-200',
                    thread.pinned && 'border-primary-200 bg-primary-50',
                    thread.resolved && 'border-green-200 bg-green-50',
                    isActive && 'ring-2 ring-primary-400 border-primary-300 dark:ring-primary-300/80'
                  )}
                >
                <CommentCard
                  comment={thread.root}
                  entityType={entityType}
                  entityId={entityId}
                  currentUser={user}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onReply={handleReply}
                  onToggleReaction={handleReactionToggle}
                  isRoot
                  canResolve={userCanModerate(user, thread.root?.user?.id)}
                  canPin={user?.role === 'admin' || user?.role === 'manager'}
                  onResolve={handleResolve}
                  onPin={handlePin}
                  resolved={thread.resolved}
                  pinned={thread.pinned}
                  mentionUsers={users}
                  threadId={thread.threadId}
                  forceEditRequest={
                    forcedEdit.threadId === thread.threadId ? forcedEdit : null
                  }
                />

                {thread.replies?.length > 0 && (
                  <div className="space-y-4 pl-8 border-l border-gray-100">
                    {thread.replies.map((reply) => (
                      <CommentCard
                        key={reply.id}
                        comment={reply}
                        entityType={entityType}
                        entityId={entityId}
                        currentUser={user}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onReply={handleReply}
                        onToggleReaction={handleReactionToggle}
                        mentionUsers={users}
                      />
                    ))}
                  </div>
                )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-6">
        <FormGroup label="Add Comment">
          <RichTextEditor
            value={newComment}
            onChange={setNewComment}
            placeholder="Type @ to mention someone..."
            users={users}
            minHeight="150px"
            focusTrigger={focusComposerSignal}
          />
          <div className="flex justify-end mt-3">
            <Button variant="primary" onClick={handlePostComment} disabled={!newComment.trim()}>
              Post Comment
            </Button>
          </div>
        </FormGroup>
      </div>
    </div>
  )
}

ThreadedCommentsSection.propTypes = {
  entityType: PropTypes.oneOf(['story', 'task']).isRequired,
  entityId: PropTypes.string.isRequired,
  users: PropTypes.array,
  enableShortcuts: PropTypes.bool,
}

