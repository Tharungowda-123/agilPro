import ExcelJS from 'exceljs'
import {
  ProgramIncrement,
  Feature,
  Story,
  Task,
  Project,
  Sprint,
  Team,
  TimeEntry,
  User,
} from '../models/index.js'
import { successResponse } from '../utils/response.js'
import { NotFoundError } from '../utils/errors.js'
import logger from '../utils/logger.js'
import {
  generatePDF,
  generatePDFFromURL,
  generateDashboardHTML,
  formatDateForFilename,
} from '../services/export.service.js'

/**
 * Export PI Plan to Excel
 * GET /api/export/pi/:piId/excel
 */
export const exportPIPlan = async (req, res, next) => {
  try {
    const { piId } = req.params

    // Fetch PI with all data
    const pi = await ProgramIncrement.findById(piId)
      .populate({
        path: 'features',
        populate: {
          path: 'stories',
          populate: {
            path: 'tasks',
            populate: {
              path: 'assignedTo',
              select: 'name email',
            },
          },
        },
      })

    if (!pi) {
      throw new NotFoundError('Program Increment not found')
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'AgileSAFe Platform'
    workbook.created = new Date()

    // Sheet 1: PI Overview
    const overviewSheet = workbook.addWorksheet('PI Overview')
    overviewSheet.columns = [
      { header: 'Field', key: 'field', width: 30 },
      { header: 'Value', key: 'value', width: 50 },
    ]

    overviewSheet.addRow({ field: 'PI Name', value: pi.name })
    overviewSheet.addRow({ field: 'Description', value: pi.description || '' })
    overviewSheet.addRow({
      field: 'Start Date',
      value: pi.startDate ? new Date(pi.startDate).toLocaleDateString() : '',
    })
    overviewSheet.addRow({
      field: 'End Date',
      value: pi.endDate ? new Date(pi.endDate).toLocaleDateString() : '',
    })
    overviewSheet.addRow({ field: 'Status', value: pi.status || '' })
    overviewSheet.addRow({
      field: 'Total Capacity',
      value: pi.capacity?.totalStoryPoints || 0,
    })
    overviewSheet.addRow({
      field: 'Allocated Points',
      value: pi.capacity?.allocatedStoryPoints || 0,
    })
    overviewSheet.addRow({ field: 'Features', value: pi.features?.length || 0 })

    // Style overview
    overviewSheet.getRow(1).font = { bold: true }
    overviewSheet.getColumn('field').font = { bold: true }

    // Sheet 2: Features
    const featuresSheet = workbook.addWorksheet('Features')
    featuresSheet.columns = [
      { header: 'Feature ID', key: 'id', width: 15 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Business Value', key: 'businessValue', width: 30 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Estimated Points', key: 'estimatedPoints', width: 15 },
      { header: 'Actual Points', key: 'actualPoints', width: 15 },
      { header: 'Progress', key: 'progress', width: 12 },
    ]

    if (pi.features && Array.isArray(pi.features)) {
      pi.features.forEach((feature) => {
        const stories = feature.stories || []
        const completedStories = stories.filter((s) => s.status === 'done').length
        const totalStories = stories.length
        const progress = totalStories > 0 ? `${completedStories}/${totalStories}` : '0/0'

        featuresSheet.addRow({
          id: feature._id.toString(),
          title: feature.title || '',
          description: feature.description || '',
          businessValue: feature.businessValue || '',
          priority: feature.priority || '',
          status: feature.status || '',
          estimatedPoints: feature.estimatedStoryPoints || 0,
          actualPoints: feature.actualStoryPoints || 0,
          progress,
        })
      })
    }

    // Style features
    featuresSheet.getRow(1).font = { bold: true }
    featuresSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    }
    featuresSheet.getRow(1).font = { ...featuresSheet.getRow(1).font, color: { argb: 'FFFFFFFF' } }

    // Sheet 3: Stories
    const storiesSheet = workbook.addWorksheet('Stories')
    storiesSheet.columns = [
      { header: 'Story ID', key: 'id', width: 15 },
      { header: 'Feature ID', key: 'featureId', width: 15 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Acceptance Criteria', key: 'criteria', width: 50 },
      { header: 'Story Points', key: 'points', width: 12 },
      { header: 'Priority', key: 'priority', width: 10 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Tasks', key: 'tasks', width: 10 },
    ]

    if (pi.features && Array.isArray(pi.features)) {
      pi.features.forEach((feature) => {
        const stories = feature.stories || []
        stories.forEach((story) => {
          const tasks = story.tasks || []
          storiesSheet.addRow({
            id: story._id.toString(),
            featureId: feature._id.toString(),
            title: story.title || '',
            description: story.description || '',
            criteria: Array.isArray(story.acceptanceCriteria)
              ? story.acceptanceCriteria.join('\n')
              : '',
            points: story.storyPoints || 0,
            priority: story.priority || '',
            status: story.status || '',
            tasks: tasks.length,
          })
        })
      })
    }

    storiesSheet.getRow(1).font = { bold: true }
    storiesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    }
    storiesSheet.getRow(1).font = { ...storiesSheet.getRow(1).font, color: { argb: 'FFFFFFFF' } }

    // Sheet 4: Tasks
    const tasksSheet = workbook.addWorksheet('Tasks')
    tasksSheet.columns = [
      { header: 'Task ID', key: 'id', width: 15 },
      { header: 'Story ID', key: 'storyId', width: 15 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Estimated Hours', key: 'hours', width: 15 },
      { header: 'Actual Hours', key: 'actualHours', width: 15 },
      { header: 'Skills Required', key: 'skills', width: 30 },
      { header: 'Assigned To', key: 'assignee', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
    ]

    if (pi.features && Array.isArray(pi.features)) {
      pi.features.forEach((feature) => {
        const stories = feature.stories || []
        stories.forEach((story) => {
          const tasks = story.tasks || []
          tasks.forEach((task) => {
            tasksSheet.addRow({
              id: task._id.toString(),
              storyId: story._id.toString(),
              title: task.title || '',
              description: task.description || '',
              hours: task.estimatedHours || 0,
              actualHours: task.actualHours || 0,
              skills: Array.isArray(task.skills) ? task.skills.join(', ') : '',
              assignee: task.assignedTo?.name || '',
              status: task.status || '',
            })
          })
        })
      })
    }

    tasksSheet.getRow(1).font = { bold: true }
    tasksSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC000' },
    }
    tasksSheet.getRow(1).font = { ...tasksSheet.getRow(1).font, color: { argb: 'FFFFFFFF' } }

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer()

    // Set headers for download
    const fileName = `PI_Plan_${pi.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.send(buffer)
  } catch (error) {
    next(error)
  }
}

/**
 * Download Excel template
 * GET /api/export/template/excel
 */
export const downloadTemplate = async (req, res, next) => {
  try {
    const { generatePIPlanTemplate } = await import('../utils/excelTemplate.js')
    const workbook = await generatePIPlanTemplate()
    const buffer = await workbook.xlsx.writeBuffer()

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="PI_Plan_Template.xlsx"')
    res.send(buffer)
  } catch (error) {
    logger.error('Error generating template:', error)
    next(error)
  }
}

/**
 * Export Dashboard to PDF
 * GET /api/export/dashboard/pdf
 */
export const exportDashboardPDF = async (req, res, next) => {
  try {
    const { dateRange, filters } = req.query
    const user = req.user

    // Get basic stats for PDF
    const stats = {
      activeProjects: await Project.countDocuments({ isArchived: false, status: 'active' }),
      activeSprints: await Sprint.countDocuments({ status: 'active' }),
      tasksAssignedToMe: await Task.countDocuments({ assignedTo: user._id, status: { $ne: 'done' } }),
      completedThisWeek: await Task.countDocuments({
        assignedTo: user._id,
        status: 'done',
        updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    }

    // Generate HTML
    const html = generateDashboardHTML(
      stats,
      [],
      [],
      [],
      { dateRange, ...filters }
    )

    // Generate PDF
    const pdfBuffer = await generatePDF(html)

    // Set headers
    const fileName = `Dashboard_Report_${formatDateForFilename()}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.send(pdfBuffer)
  } catch (error) {
    logger.error('Error exporting dashboard PDF:', error)
    next(error)
  }
}

/**
 * Export Projects to Excel
 * GET /api/export/projects/excel
 */
export const exportProjectsExcel = async (req, res, next) => {
  try {
    const user = req.user
    const query = {}

    // Filter by user role
    if (user.role === 'manager' && user.team) {
      query.team = user.team
    }

    const projects = await Project.find(query)
      .populate('team', 'name')
      .populate('createdBy', 'name email')
      .lean()

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'AgileSAFe Platform'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Projects')
    sheet.columns = [
      { header: 'Project ID', key: 'id', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Team', key: 'team', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Progress', key: 'progress', width: 12 },
      { header: 'Start Date', key: 'startDate', width: 15 },
      { header: 'End Date', key: 'endDate', width: 15 },
      { header: 'Created By', key: 'createdBy', width: 20 },
    ]

    projects.forEach((project) => {
      sheet.addRow({
        id: project._id.toString(),
        name: project.name || '',
        description: project.description || '',
        team: project.team?.name || '',
        status: project.status || '',
        progress: `${project.progress || 0}%`,
        startDate: project.startDate ? new Date(project.startDate).toLocaleDateString() : '',
        endDate: project.endDate ? new Date(project.endDate).toLocaleDateString() : '',
        createdBy: project.createdBy?.name || '',
      })
    })

    // Style header
    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    }
    sheet.getRow(1).font = { ...sheet.getRow(1).font, color: { argb: 'FFFFFFFF' } }

    const buffer = await workbook.xlsx.writeBuffer()
    const fileName = `Projects_${formatDateForFilename()}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.send(buffer)
  } catch (error) {
    logger.error('Error exporting projects Excel:', error)
    next(error)
  }
}

/**
 * Export Stories to Excel
 * GET /api/export/stories/excel
 */
export const exportStoriesExcel = async (req, res, next) => {
  try {
    const { projectId } = req.query
    const query = {}

    if (projectId) {
      query.project = projectId
    }

    const stories = await Story.find(query)
      .populate('project', 'name')
      .populate('feature', 'title')
      .populate('createdBy', 'name email')
      .lean()

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'AgileSAFe Platform'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Stories')
    sheet.columns = [
      { header: 'Story ID', key: 'id', width: 15 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Project', key: 'project', width: 20 },
      { header: 'Feature', key: 'feature', width: 20 },
      { header: 'Story Points', key: 'points', width: 12 },
      { header: 'Priority', key: 'priority', width: 10 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Acceptance Criteria', key: 'criteria', width: 50 },
      { header: 'Created By', key: 'createdBy', width: 20 },
    ]

    stories.forEach((story) => {
      sheet.addRow({
        id: story._id.toString(),
        title: story.title || '',
        description: story.description || '',
        project: story.project?.name || '',
        feature: story.feature?.title || '',
        points: story.storyPoints || 0,
        priority: story.priority || '',
        status: story.status || '',
        criteria: Array.isArray(story.acceptanceCriteria)
          ? story.acceptanceCriteria.join('\n')
          : '',
        createdBy: story.createdBy?.name || '',
      })
    })

    // Style header
    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    }
    sheet.getRow(1).font = { ...sheet.getRow(1).font, color: { argb: 'FFFFFFFF' } }

    const buffer = await workbook.xlsx.writeBuffer()
    const fileName = `Stories_${formatDateForFilename()}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.send(buffer)
  } catch (error) {
    logger.error('Error exporting stories Excel:', error)
    next(error)
  }
}

/**
 * Export Tasks to Excel
 * GET /api/export/tasks/excel
 */
export const exportTasksExcel = async (req, res, next) => {
  try {
    const { storyId, projectId } = req.query
    const query = {}

    if (storyId) {
      query.story = storyId
    } else if (projectId) {
      query.project = projectId
    }

    const tasks = await Task.find(query)
      .populate('story', 'title')
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .lean()

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'AgileSAFe Platform'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Tasks')
    sheet.columns = [
      { header: 'Task ID', key: 'id', width: 15 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Story', key: 'story', width: 20 },
      { header: 'Project', key: 'project', width: 20 },
      { header: 'Estimated Hours', key: 'hours', width: 15 },
      { header: 'Actual Hours', key: 'actualHours', width: 15 },
      { header: 'Skills', key: 'skills', width: 30 },
      { header: 'Assigned To', key: 'assignedTo', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Created By', key: 'createdBy', width: 20 },
    ]

    tasks.forEach((task) => {
      sheet.addRow({
        id: task._id.toString(),
        title: task.title || '',
        description: task.description || '',
        story: task.story?.title || '',
        project: task.project?.name || '',
        hours: task.estimatedHours || 0,
        actualHours: task.actualHours || 0,
        skills: Array.isArray(task.skills) ? task.skills.join(', ') : '',
        assignedTo: task.assignedTo?.name || '',
        status: task.status || '',
        createdBy: task.createdBy?.name || '',
      })
    })

    // Style header
    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC000' },
    }
    sheet.getRow(1).font = { ...sheet.getRow(1).font, color: { argb: 'FFFFFFFF' } }

    const buffer = await workbook.xlsx.writeBuffer()
    const fileName = `Tasks_${formatDateForFilename()}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.send(buffer)
  } catch (error) {
    logger.error('Error exporting tasks Excel:', error)
    next(error)
  }
}

/**
 * Export Teams to Excel
 * GET /api/export/teams/excel
 */
export const exportTeamsExcel = async (req, res, next) => {
  try {
    const teams = await Team.find({ isActive: true })
      .populate('members', 'name email role')
      .populate('lead', 'name email')
      .lean()

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'AgileSAFe Platform'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Teams')
    sheet.columns = [
      { header: 'Team ID', key: 'id', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Lead', key: 'lead', width: 20 },
      { header: 'Members', key: 'members', width: 40 },
      { header: 'Member Count', key: 'memberCount', width: 12 },
      { header: 'Status', key: 'status', width: 15 },
    ]

    teams.forEach((team) => {
      const memberNames = team.members?.map((m) => m.name).join(', ') || ''
      sheet.addRow({
        id: team._id.toString(),
        name: team.name || '',
        description: team.description || '',
        lead: team.lead?.name || '',
        members: memberNames,
        memberCount: team.members?.length || 0,
        status: team.isActive ? 'Active' : 'Inactive',
      })
    })

    // Style header
    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7030A0' },
    }
    sheet.getRow(1).font = { ...sheet.getRow(1).font, color: { argb: 'FFFFFFFF' } }

    const buffer = await workbook.xlsx.writeBuffer()
    const fileName = `Teams_${formatDateForFilename()}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.send(buffer)
  } catch (error) {
    logger.error('Error exporting teams Excel:', error)
    next(error)
  }
}

/**
 * Export Custom Report
 * POST /api/export/custom
 */
export const exportCustomReport = async (req, res, next) => {
  try {
    const { type, format, filters } = req.body

    if (!type || !format) {
      return res.status(400).json({ message: 'Type and format are required' })
    }

    let data = []
    let fileName = ''

    // Fetch data based on type
    switch (type) {
      case 'projects':
        const projects = await Project.find(filters || {})
          .populate('team', 'name')
          .lean()
        data = projects
        fileName = `Custom_Projects_Report_${formatDateForFilename()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
        break

      case 'stories':
        const stories = await Story.find(filters || {})
          .populate('project', 'name')
          .lean()
        data = stories
        fileName = `Custom_Stories_Report_${formatDateForFilename()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
        break

      case 'tasks':
        const tasks = await Task.find(filters || {})
          .populate('story', 'title')
          .lean()
        data = tasks
        fileName = `Custom_Tasks_Report_${formatDateForFilename()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
        break

      default:
        return res.status(400).json({ message: 'Invalid report type' })
    }

    if (format === 'pdf') {
      // Generate PDF
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Custom Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; border: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Custom Report - ${type}</h1>
          <p>Generated: ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                ${Object.keys(data[0] || {}).map((key) => `<th>${key}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map((row) => `
                <tr>
                  ${Object.values(row).map((val) => `<td>${val || ''}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `
      const pdfBuffer = await generatePDF(html)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
      res.send(pdfBuffer)
    } else {
      // Generate Excel
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'AgileSAFe Platform'
      workbook.created = new Date()

      const sheet = workbook.addWorksheet('Report')
      if (data.length > 0) {
        const headers = Object.keys(data[0])
        sheet.columns = headers.map((h) => ({ header: h, key: h, width: 20 }))

        data.forEach((row) => {
          sheet.addRow(row)
        })

        // Style header
        sheet.getRow(1).font = { bold: true }
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' },
        }
        sheet.getRow(1).font = { ...sheet.getRow(1).font, color: { argb: 'FFFFFFFF' } }
      }

      const buffer = await workbook.xlsx.writeBuffer()
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
      res.send(buffer)
    }
  } catch (error) {
    logger.error('Error exporting custom report:', error)
    next(error)
  }
}

/**
 * Export Time Entries to PDF
 * GET /api/export/time-entries/pdf
 */
export const exportTimeEntriesPDF = async (req, res, next) => {
  try {
    const { startDate, endDate, userId, projectId } = req.query
    const query = {}

    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }

    if (userId) {
      query.user = userId
    }

    const timeEntries = await TimeEntry.find(query)
      .populate('task', 'title')
      .populate('user', 'name email')
      .sort({ date: -1 })
      .lean()

    // Filter by project if needed
    let filteredEntries = timeEntries
    if (projectId) {
      const taskIds = await Task.find({ project: projectId }).select('_id').lean()
      const taskIdSet = new Set(taskIds.map((t) => t._id.toString()))
      filteredEntries = timeEntries.filter((entry) =>
        taskIdSet.has(entry.task?._id?.toString())
      )
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Time Entries Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; border: 1px solid #ddd; text-align: left; }
          th { background-color: #3b82f6; color: white; }
          .total { font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Time Entries Report</h1>
          <p>Generated: ${new Date().toLocaleDateString()}</p>
          ${startDate || endDate ? `<p>Date Range: ${startDate || 'Start'} to ${endDate || 'End'}</p>` : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Task</th>
              <th>Hours</th>
              <th>Description</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            ${filteredEntries.map((entry) => `
              <tr>
                <td>${new Date(entry.date).toLocaleDateString()}</td>
                <td>${entry.user?.name || ''}</td>
                <td>${entry.task?.title || ''}</td>
                <td>${entry.hours || 0}</td>
                <td>${entry.description || ''}</td>
                <td>${entry.entryType || 'manual'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">
          Total Hours: ${filteredEntries.reduce((sum, e) => sum + (e.hours || 0), 0).toFixed(2)}
        </div>
      </body>
      </html>
    `

    const pdfBuffer = await generatePDF(html)
    const fileName = `Time_Entries_${formatDateForFilename()}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.send(pdfBuffer)
  } catch (error) {
    logger.error('Error exporting time entries PDF:', error)
    next(error)
  }
}

/**
 * Export Time Entries to Excel
 * GET /api/export/time-entries/excel
 */
export const exportTimeEntriesExcel = async (req, res, next) => {
  try {
    const { startDate, endDate, userId, projectId } = req.query
    const query = {}

    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }

    if (userId) {
      query.user = userId
    }

    const timeEntries = await TimeEntry.find(query)
      .populate('task', 'title')
      .populate('user', 'name email')
      .sort({ date: -1 })
      .lean()

    // Filter by project if needed
    let filteredEntries = timeEntries
    if (projectId) {
      const taskIds = await Task.find({ project: projectId }).select('_id').lean()
      const taskIdSet = new Set(taskIds.map((t) => t._id.toString()))
      filteredEntries = timeEntries.filter((entry) =>
        taskIdSet.has(entry.task?._id?.toString())
      )
    }

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'AgileSAFe Platform'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Time Entries')
    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'User', key: 'user', width: 20 },
      { header: 'Task', key: 'task', width: 30 },
      { header: 'Hours', key: 'hours', width: 12 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Type', key: 'type', width: 12 },
    ]

    filteredEntries.forEach((entry) => {
      sheet.addRow({
        date: new Date(entry.date).toLocaleDateString(),
        user: entry.user?.name || '',
        task: entry.task?.title || '',
        hours: entry.hours || 0,
        description: entry.description || '',
        type: entry.entryType || 'manual',
      })
    })

    // Add total row
    const totalHours = filteredEntries.reduce((sum, e) => sum + (e.hours || 0), 0)
    sheet.addRow({
      date: 'TOTAL',
      user: '',
      task: '',
      hours: totalHours,
      description: '',
      type: '',
    })

    // Style header
    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0070C0' },
    }
    sheet.getRow(1).font = { ...sheet.getRow(1).font, color: { argb: 'FFFFFFFF' } }

    // Style total row
    const totalRowIndex = filteredEntries.length + 2
    sheet.getRow(totalRowIndex).font = { bold: true }
    sheet.getRow(totalRowIndex).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC000' },
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const fileName = `Time_Entries_${formatDateForFilename()}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.send(buffer)
  } catch (error) {
    logger.error('Error exporting time entries Excel:', error)
    next(error)
  }
}

// Default export
export default {
  exportPIPlan,
  downloadTemplate,
  exportDashboardPDF,
  exportProjectsExcel,
  exportStoriesExcel,
  exportTasksExcel,
  exportTeamsExcel,
  exportCustomReport,
  exportTimeEntriesPDF,
  exportTimeEntriesExcel,
}
