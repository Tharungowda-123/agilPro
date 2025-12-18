import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

// Create a window object for DOMPurify in Node.js
const window = new JSDOM('').window
const purify = DOMPurify(window)

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - HTML content to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized HTML
 */
export const sanitizeHTML = (html, options = {}) => {
  if (!html || typeof html !== 'string') {
    return ''
  }

  const defaultOptions = {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'blockquote',
      'code',
      'pre',
      'hr',
      'img',
      'span',
      'div',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
    ALLOW_DATA_ATTR: false,
    ...options,
  }

  return purify.sanitize(html, defaultOptions)
}

/**
 * Sanitize markdown content (convert to HTML then sanitize)
 * @param {string} markdown - Markdown content
 * @returns {string} Sanitized HTML
 */
export const sanitizeMarkdown = (markdown) => {
  if (!markdown || typeof markdown !== 'string') {
    return ''
  }

  // For now, just sanitize as HTML
  // In production, you might want to use a markdown parser first
  return sanitizeHTML(markdown)
}

