import cron from 'node-cron'
import { findDueReports, runReport, updateReportSchedule } from '../services/report.service.js'
import { CustomReport } from '../models/index.js'
import { sendEmail } from '../services/email.service.js'

const buildEmailBody = (report, datasets) => {
  const rows = datasets
    .map(
      (dataset) => `
        <tr>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;">
            <strong>${dataset.title || dataset.metric}</strong>
            <div style="font-size:12px;color:#6b7280;margin-top:4px;">
              ${JSON.stringify(dataset.data)}
            </div>
          </td>
        </tr>
      `
    )
    .join('')

  return `
    <h2 style="font-family:Inter,Arial,sans-serif;">${report.name}</h2>
    <p style="color:#374151;">Here is your scheduled report summary.</p>
    <table style="border-collapse:collapse;border:1px solid #e5e7eb;width:100%;">
      ${rows}
    </table>
  `
}

const deliverReport = async (report) => {
  if (!report.schedule?.recipients || report.schedule.recipients.length === 0) {
    return
  }

  const datasets = await runReport({
    widgets: report.widgets,
    filters: report.filters,
  })

  const html = buildEmailBody(report, datasets)
  const uniqueRecipients = [...new Set(report.schedule.recipients)]

  await Promise.all(
    uniqueRecipients.map((recipient) =>
      sendEmail(recipient, `Scheduled Report: ${report.name}`, html)
    )
  )

  const reportDoc = await CustomReport.findById(report._id)
  if (reportDoc) {
    reportDoc.lastRunAt = new Date()
    reportDoc.lastRunSummary = new Map(
      datasets.map((dataset) => [
        dataset.id,
        {
          metric: dataset.metric,
          preview: dataset.data,
        },
      ])
    )
    await updateReportSchedule(reportDoc, {
      ...reportDoc.schedule.toObject(),
      enabled: true,
    })
    reportDoc.schedule.lastRunAt = new Date()
    await reportDoc.save()
  }
}

export const startReportScheduler = () => {
  cron.schedule('*/15 * * * *', async () => {
    try {
      const dueReports = await findDueReports()
      for (const report of dueReports) {
        await deliverReport(report)
      }
    } catch (error) {
      console.error('Report scheduler error:', error)
    }
  })
}


