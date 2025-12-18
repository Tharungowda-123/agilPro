import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Mention from '@tiptap/extension-mention'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import tippy from 'tippy.js'
import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Eye,
  EyeOff,
  FileText,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/utils'
import { useUsers } from '@/hooks/api'
import 'tippy.js/dist/tippy.css'

// Initialize lowlight for code syntax highlighting
const lowlight = createLowlight()

// Configure marked for markdown rendering
marked.setOptions({
  breaks: true,
  gfm: true,
})

/**
 * RichTextEditor Component
 * Full-featured rich text editor with formatting, markdown, and mentions
 */
export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start typing...',
  users = [],
  onImageUpload,
  maxLength,
  className = '',
  minHeight = '200px',
  showToolbar = true,
  showMarkdownToggle = true,
  showCharacterCount = false,
  focusTrigger = 0,
}) {
  const [isMarkdownMode, setIsMarkdownMode] = useState(false)
  const [markdownText, setMarkdownText] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const { data: usersData } = useUsers()
  const allUsers = users.length > 0 ? users : usersData?.data || usersData || []

  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false, // We'll use CodeBlockLowlight instead
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-600 underline',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full rounded',
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'text-primary-600 font-medium bg-primary-50 px-1 rounded',
        },
        suggestion: {
          items: ({ query }) => {
            return allUsers
              .filter((user) => {
                const name = user.name || user.email || ''
                return name.toLowerCase().includes(query.toLowerCase())
              })
              .slice(0, 5)
              .map((user) => ({
                id: user._id || user.id,
                label: user.name || user.email,
                email: user.email,
                name: user.name,
              }))
          },
          render: () => {
            let component
            let popup

            return {
              onStart: (props) => {
                component = createMentionList(props)
                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                })
              },
              onUpdate(props) {
                component.updateProps(props)
                if (popup[0]) {
                  popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                  })
                }
              },
              onKeyDown(props) {
                if (props.event.key === 'Escape') {
                  if (popup[0]) popup[0].hide()
                  return true
                }
                return component.onKeyDown(props)
              },
              onExit() {
                if (popup[0]) popup[0].destroy()
                component.destroy()
              },
            }
          },
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
    },
    editorProps: {
      attributes: {
        class: 'ProseMirror focus:outline-none p-4',
        'data-placeholder': placeholder,
      },
    },
  })

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  useEffect(() => {
    if (editor && focusTrigger > 0) {
      editor.commands.focus('end')
    }
  }, [editor, focusTrigger])

  // Handle markdown mode
  useEffect(() => {
    if (isMarkdownMode && editor) {
      setMarkdownText(editor.storage.markdown?.getMarkdown() || '')
    }
  }, [isMarkdownMode, editor])

  // Handle image paste
  const handleImagePaste = useCallback(
    async (file) => {
      if (!onImageUpload) return

      try {
        const imageUrl = await onImageUpload(file)
        if (imageUrl && editor) {
          editor.chain().focus().setImage({ src: imageUrl }).run()
        }
      } catch (error) {
        console.error('Error uploading image:', error)
      }
    },
    [onImageUpload, editor]
  )

  // Handle paste events
  useEffect(() => {
    if (!editor) return

    const handlePaste = (event) => {
      const items = event.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.indexOf('image') !== -1) {
          event.preventDefault()
          const file = item.getAsFile()
          if (file) {
            handleImagePaste(file)
          }
        }
      }
    }

    const editorElement = editor.view.dom
    editorElement.addEventListener('paste', handlePaste)

    return () => {
      editorElement.removeEventListener('paste', handlePaste)
    }
  }, [editor, handleImagePaste])

  // Toggle markdown mode
  const toggleMarkdownMode = () => {
    if (editor) {
      if (isMarkdownMode) {
        // Convert markdown to HTML
        const html = DOMPurify.sanitize(marked.parse(markdownText))
        editor.commands.setContent(html)
        setIsMarkdownMode(false)
      } else {
        // Convert HTML to markdown (simplified)
        setMarkdownText(editor.storage.markdown?.getMarkdown() || '')
        setIsMarkdownMode(true)
      }
    }
  }

  // Render markdown preview
  const renderMarkdownPreview = () => {
    if (!markdownText) return <p className="text-gray-400 italic">No content to preview</p>
    const html = DOMPurify.sanitize(marked.parse(markdownText))
    return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
  }

  if (!editor) {
    return <div className="animate-pulse bg-gray-100 rounded p-4" style={{ minHeight }} />
  }

  return (
    <div className={cn('border border-gray-300 rounded-lg bg-white', className)}>
      {/* Toolbar */}
      {showToolbar && !isMarkdownMode && (
        <div className="flex items-center gap-1 p-2 border-b border-gray-200 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(editor.isActive('bold') && 'bg-gray-200')}
            leftIcon={<Bold className="w-4 h-4" />}
            title="Bold"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(editor.isActive('italic') && 'bg-gray-200')}
            leftIcon={<Italic className="w-4 h-4" />}
            title="Italic"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(editor.isActive('underline') && 'bg-gray-200')}
            leftIcon={<Underline className="w-4 h-4" />}
            title="Underline"
          />
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(editor.isActive('heading', { level: 1 }) && 'bg-gray-200')}
            leftIcon={<Heading1 className="w-4 h-4" />}
            title="Heading 1"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(editor.isActive('heading', { level: 2 }) && 'bg-gray-200')}
            leftIcon={<Heading2 className="w-4 h-4" />}
            title="Heading 2"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(editor.isActive('heading', { level: 3 }) && 'bg-gray-200')}
            leftIcon={<Heading3 className="w-4 h-4" />}
            title="Heading 3"
          />
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(editor.isActive('bulletList') && 'bg-gray-200')}
            leftIcon={<List className="w-4 h-4" />}
            title="Bullet List"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(editor.isActive('orderedList') && 'bg-gray-200')}
            leftIcon={<ListOrdered className="w-4 h-4" />}
            title="Numbered List"
          />
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = window.prompt('Enter URL:')
              if (url) {
                editor.chain().focus().setLink({ href: url }).run()
              }
            }}
            className={cn(editor.isActive('link') && 'bg-gray-200')}
            leftIcon={<LinkIcon className="w-4 h-4" />}
            title="Insert Link"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = window.prompt('Enter image URL:')
              if (url) {
                editor.chain().focus().setImage({ src: url }).run()
              }
            }}
            leftIcon={<ImageIcon className="w-4 h-4" />}
            title="Insert Image"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn(editor.isActive('codeBlock') && 'bg-gray-200')}
            leftIcon={<Code className="w-4 h-4" />}
            title="Code Block"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(editor.isActive('blockquote') && 'bg-gray-200')}
            leftIcon={<Quote className="w-4 h-4" />}
            title="Blockquote"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            leftIcon={<Minus className="w-4 h-4" />}
            title="Horizontal Rule"
          />
          <div className="flex-1" />
          {showMarkdownToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMarkdownMode}
              leftIcon={<FileText className="w-4 h-4" />}
            >
              Markdown
            </Button>
          )}
        </div>
      )}

      {/* Editor Content */}
      {isMarkdownMode ? (
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Markdown Mode</span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                leftIcon={showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              >
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleMarkdownMode}>
                Back to Editor
              </Button>
            </div>
          </div>
          {showPreview ? (
            <div className="border border-gray-200 rounded p-4 min-h-[200px]">{renderMarkdownPreview()}</div>
          ) : (
            <textarea
              value={markdownText}
              onChange={(e) => {
                setMarkdownText(e.target.value)
                const html = DOMPurify.sanitize(marked.parse(e.target.value))
                onChange?.(html)
              }}
              className="w-full p-3 border border-gray-200 rounded font-mono text-sm"
              style={{ minHeight }}
              placeholder="Write in Markdown..."
            />
          )}
        </div>
      ) : (
        <EditorContent editor={editor} style={{ minHeight }} />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between p-2 border-t border-gray-200 text-xs text-gray-500">
        <div>
          {editor.storage.characterCount && showCharacterCount && (
            <span>
              {editor.storage.characterCount.characters()}
              {maxLength && ` / ${maxLength} characters`}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400">
          Type @ to mention someone • Paste images to upload
        </div>
      </div>
    </div>
  )
}

// Simple mention list component
function createMentionList(props) {
  let { items, command } = props
  let selectedIndex = 0

  const selectItem = (index) => {
    const item = items[index]
    if (item) {
      command(item)
    }
  }

  const upHandler = () => {
    selectedIndex = (selectedIndex + items.length - 1) % items.length
    updateSelection()
  }

  const downHandler = () => {
    selectedIndex = (selectedIndex + 1) % items.length
    updateSelection()
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  const updateSelection = () => {
    const buttons = element.querySelectorAll('button')
    buttons.forEach((btn, idx) => {
      if (idx === selectedIndex) {
        btn.classList.add('bg-gray-100')
      } else {
        btn.classList.remove('bg-gray-100')
      }
    })
  }

  const element = document.createElement('div')
  element.className = 'bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px]'

  const render = () => {
    element.innerHTML = ''
    if (items.length) {
      items.forEach((item, index) => {
        const button = document.createElement('button')
        button.className = cn(
          'w-full text-left px-3 py-2 rounded hover:bg-gray-100',
          index === selectedIndex && 'bg-gray-100'
        )
        button.innerHTML = `
          <div class="font-medium">${item.label || item.name || item.email}</div>
          ${item.email && item.name ? `<div class="text-xs text-gray-500">${item.email}</div>` : ''}
        `
        button.addEventListener('click', () => selectItem(index))
        element.appendChild(button)
      })
    } else {
      const noResults = document.createElement('div')
      noResults.className = 'px-3 py-2 text-gray-500 text-sm'
      noResults.textContent = 'No results'
      element.appendChild(noResults)
    }
  }

  render()

  return {
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }
      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }
      if (event.key === 'Enter') {
        enterHandler()
        return true
      }
      return false
    },
    element,
    updateProps: (newProps) => {
      items = newProps.items
      command = newProps.command
      selectedIndex = 0
      render()
    },
    destroy: () => {
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    },
  }
}

