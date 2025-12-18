import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import {
  createSprintMeeting,
  getSprintMeetingsHandler,
  updateSprintMeetingHandler,
  deleteSprintMeetingHandler,
  addMeetingAgendaItemHandler,
  addMeetingNoteHandler,
  resendMeetingInvitesHandler,
} from '../controllers/meeting.controller.js'
import {
  createMeetingSchema,
  updateMeetingSchema,
  addAgendaItemSchema,
  addMeetingNoteSchema,
} from '../validators/meeting.validator.js'

const router = express.Router()

router.use(authenticateToken)

router
  .route('/sprints/:sprintId/meetings')
  .get(getSprintMeetingsHandler)
  .post(validate(createMeetingSchema), createSprintMeeting)

router
  .route('/meetings/:meetingId')
  .put(validate(updateMeetingSchema), updateSprintMeetingHandler)
  .delete(deleteSprintMeetingHandler)

router.post('/meetings/:meetingId/agenda', validate(addAgendaItemSchema), addMeetingAgendaItemHandler)
router.post('/meetings/:meetingId/notes', validate(addMeetingNoteSchema), addMeetingNoteHandler)
router.post('/meetings/:meetingId/resend-invites', resendMeetingInvitesHandler)

export default router

