import ExcelJS from 'exceljs'

/**
 * Generate Excel template for PI Planning import
 */
export async function generatePIPlanTemplate() {
  const workbook = new ExcelJS.Workbook()

  // Sheet 1: Features
  const featuresSheet = workbook.addWorksheet('Features')
  featuresSheet.columns = [
    { header: 'Feature ID', key: 'id', width: 15 },
    { header: 'Title*', key: 'title', width: 30 },
    { header: 'Description*', key: 'description', width: 50 },
    { header: 'Business Value', key: 'businessValue', width: 30 },
    { header: 'Priority*', key: 'priority', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Estimated Points', key: 'estimatedPoints', width: 15 },
  ]

  // Add example row
  featuresSheet.addRow({
    id: 'FEAT-001',
    title: 'User Authentication System',
    description: 'Implement complete user authentication with login, registration, and password reset',
    businessValue: 'Enable secure user access to the platform',
    priority: 'High',
    status: 'Draft',
    estimatedPoints: 25,
  })

  // Style header
  featuresSheet.getRow(1).font = { bold: true }
  featuresSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  }
  featuresSheet.getRow(1).font = { ...featuresSheet.getRow(1).font, color: { argb: 'FFFFFFFF' } }

  // Sheet 2: Stories
  const storiesSheet = workbook.addWorksheet('Stories')
  storiesSheet.columns = [
    { header: 'Story ID', key: 'id', width: 15 },
    { header: 'Feature ID*', key: 'featureId', width: 15 },
    { header: 'Title*', key: 'title', width: 30 },
    { header: 'Description*', key: 'description', width: 50 },
    { header: 'Acceptance Criteria', key: 'criteria', width: 50 },
    { header: 'Story Points*', key: 'points', width: 12 },
    { header: 'Priority', key: 'priority', width: 10 },
    { header: 'Status', key: 'status', width: 15 },
  ]

  storiesSheet.addRow({
    id: 'PROJ-001',
    featureId: 'FEAT-001',
    title: 'User Registration',
    description: 'As a user, I want to register with email/password',
    criteria: 'User can enter email\nPassword validation\nConfirmation email sent',
    points: 5,
    priority: 'High',
    status: 'Ready',
  })

  storiesSheet.getRow(1).font = { bold: true }
  storiesSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF70AD47' },
  }
  storiesSheet.getRow(1).font = { ...storiesSheet.getRow(1).font, color: { argb: 'FFFFFFFF' } }

  // Sheet 3: Tasks
  const tasksSheet = workbook.addWorksheet('Tasks')
  tasksSheet.columns = [
    { header: 'Task ID', key: 'id', width: 15 },
    { header: 'Story ID*', key: 'storyId', width: 15 },
    { header: 'Title*', key: 'title', width: 30 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Estimated Hours', key: 'hours', width: 15 },
    { header: 'Skills Required', key: 'skills', width: 30 },
    { header: 'Assigned To', key: 'assignee', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
  ]

  tasksSheet.addRow({
    id: 'TASK-001',
    storyId: 'PROJ-001',
    title: 'Create registration form UI',
    description: 'Design and implement registration form with email/password fields',
    hours: 4,
    skills: 'React, UI/UX',
    assignee: 'Alice Johnson',
    status: 'Todo',
  })

  tasksSheet.getRow(1).font = { bold: true }
  tasksSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFC000' },
  }
  tasksSheet.getRow(1).font = { ...tasksSheet.getRow(1).font, color: { argb: 'FFFFFFFF' } }

  // Sheet 4: Instructions
  const instructionsSheet = workbook.addWorksheet('Instructions')
  instructionsSheet.mergeCells('A1:B1')
  instructionsSheet.getCell('A1').value = 'PI Planning Import Template - Instructions'
  instructionsSheet.getCell('A1').font = { bold: true, size: 16 }

  instructionsSheet.addRow([])
  instructionsSheet.addRow(['1. Fill in Features, Stories, and Tasks sheets'])
  instructionsSheet.addRow(['2. Fields marked with * are required'])
  instructionsSheet.addRow(['3. Priority values: Critical, High, Medium, Low'])
  instructionsSheet.addRow([
    '4. Status values (Features): Draft, Ready, In-Breakdown, Broken-Down, In-Progress, Completed',
  ])
  instructionsSheet.addRow(['5. Status values (Stories/Tasks): Todo, In-Progress, Review, Done'])
  instructionsSheet.addRow(['6. Story Points: Use Fibonacci sequence (1, 2, 3, 5, 8, 13, 21)'])
  instructionsSheet.addRow(['7. Skills: Comma-separated (e.g., "React, Node.js, MongoDB")'])
  instructionsSheet.addRow(['8. Acceptance Criteria: Use line breaks for multiple criteria'])
  instructionsSheet.addRow([])
  instructionsSheet.addRow(['9. Upload this file in the PI Planning import page'])

  return workbook
}

