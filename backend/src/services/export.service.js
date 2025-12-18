import puppeteer from 'puppeteer'
import XLSX from 'xlsx'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import logger from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Export Service
 * Handles PDF and Excel export generation
 */

/**
 * Generate PDF from HTML content
 * @param {string} html - HTML content to convert to PDF
 * @param {Object} options - PDF options
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generatePDF = async (html, options = {}) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    })

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      ...options,
    })

    await browser.close()

    return pdf
  } catch (error) {
    logger.error('Error generating PDF:', error)
    throw error
  }
}

/**
 * Generate PDF from URL (for dashboard/reports)
 * @param {string} url - URL to capture
 * @param {Object} options - PDF options
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generatePDFFromURL = async (url, options = {}) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    // Navigate to URL
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    // Wait for charts to render
    await page.waitForTimeout(2000)

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      ...options,
    })

    await browser.close()

    return pdf
  } catch (error) {
    logger.error('Error generating PDF from URL:', error)
    throw error
  }
}

/**
 * Generate Excel workbook from data
 * @param {Array<Object>} sheets - Array of sheet configurations [{name, data, headers}]
 * @returns {Buffer} Excel buffer
 */
export const generateExcel = (sheets) => {
  try {
    const workbook = XLSX.utils.book_new()

    sheets.forEach((sheet) => {
      const { name, data, headers } = sheet

      // If headers are provided, use them
      let worksheet
      if (headers && data.length > 0) {
        // Create worksheet with headers
        const worksheetData = [headers, ...data.map((row) => headers.map((h) => row[h.key || h] || ''))]
        worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      } else {
        // Auto-generate from data
        worksheet = XLSX.utils.json_to_sheet(data)
      }

      // Set column widths
      const maxWidth = 50
      const colWidths = []
      if (headers) {
        headers.forEach((header, index) => {
          const headerText = typeof header === 'string' ? header : header.label || header.key || ''
          const maxLength = Math.max(
            headerText.length,
            ...data.map((row) => {
              const value = typeof header === 'string' ? row[header] : row[header.key || '']
              return String(value || '').length
            })
          )
          colWidths.push({ wch: Math.min(maxLength + 2, maxWidth) })
        })
      } else if (data.length > 0) {
        const keys = Object.keys(data[0])
        keys.forEach((key) => {
          const maxLength = Math.max(
            key.length,
            ...data.map((row) => String(row[key] || '').length)
          )
          colWidths.push({ wch: Math.min(maxLength + 2, maxWidth) })
        })
      }

      if (colWidths.length > 0) {
        worksheet['!cols'] = colWidths
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, name)
    })

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return buffer
  } catch (error) {
    logger.error('Error generating Excel:', error)
    throw error
  }
}

/**
 * Format date for filename
 */
export const formatDateForFilename = (date = new Date()) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Generate dashboard HTML for PDF
 */
export const generateDashboardHTML = (stats, velocityData, activities, deadlines, filters = {}) => {
  const dateRange = filters.dateRange || 'All time'
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Dashboard Report - ${generatedDate}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #333;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
        }
        .header {
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
        }
        .header .meta {
          color: #6b7280;
          margin-top: 10px;
          font-size: 14px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }
        .stat-card h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #6b7280;
          text-transform: uppercase;
        }
        .stat-card .value {
          font-size: 32px;
          font-weight: bold;
          color: #1f2937;
        }
        .section {
          margin-bottom: 40px;
        }
        .section h2 {
          color: #1f2937;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        table th,
        table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        table th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #374151;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Dashboard Report</h1>
        <div class="meta">
          Generated: ${generatedDate} | Date Range: ${dateRange}
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <h3>Active Projects</h3>
          <div class="value">${stats?.activeProjects || 0}</div>
        </div>
        <div class="stat-card">
          <h3>Active Sprints</h3>
          <div class="value">${stats?.activeSprints || 0}</div>
        </div>
        <div class="stat-card">
          <h3>Tasks Assigned</h3>
          <div class="value">${stats?.tasksAssignedToMe || 0}</div>
        </div>
        <div class="stat-card">
          <h3>Completed This Week</h3>
          <div class="value">${stats?.completedThisWeek || 0}</div>
        </div>
      </div>

      ${activities && activities.length > 0 ? `
        <div class="section">
          <h2>Recent Activities</h2>
          <table>
            <thead>
              <tr>
                <th>Activity</th>
                <th>User</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${activities.slice(0, 10).map((activity) => `
                <tr>
                  <td>${activity.description || activity.message || 'N/A'}</td>
                  <td>${activity.user?.name || activity.userName || 'N/A'}</td>
                  <td>${activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${deadlines && deadlines.length > 0 ? `
        <div class="section">
          <h2>Upcoming Deadlines</h2>
          <table>
            <thead>
              <tr>
                <th>Task/Story</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${deadlines.slice(0, 10).map((deadline) => `
                <tr>
                  <td>${deadline.title || deadline.name || 'N/A'}</td>
                  <td>${deadline.dueDate ? new Date(deadline.dueDate).toLocaleDateString() : 'N/A'}</td>
                  <td>${deadline.status || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="footer">
        <p>Generated by AgileSAFe - ${generatedDate}</p>
      </div>
    </body>
    </html>
  `
}

