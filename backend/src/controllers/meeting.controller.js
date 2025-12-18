import {
  scheduleSprintMeeting,
  getSprintMeetings,
  updateSprintMeeting,
  deleteSprintMeeting,
  addMeetingAgendaItem,
  addMeetingNote,
  resendMeetingInvites,
} from '../services/meeting.service.js'
import { successResponse } from '../utils/response.js'
import { ForbiddenError } from '../utils/errors.js'

const ensureManager = (user) => {
  if (!user) {
    throw new ForbiddenError('Authentication required')
  }
  if (!['manager', 'admin'].includes(user.role)) {
    throw new ForbiddenError('Only managers or admins can manage meetings')
  }
}

export const createSprintMeeting = async (req, res, next) => {
  try {
    ensureManager(req.user)
    const meeting = await scheduleSprintMeeting({
      sprintId: req.params.sprintId,
      payload: req.body,
      actor: req.user,
      req,
    })
    return successResponse(res, { meeting }, 'Meeting scheduled successfully', 201)
  } catch (error) {
    next(error)
  }
}

export const getSprintMeetingsHandler = async (req, res, next) => {
  try {
    const meetings = await getSprintMeetings(req.params.sprintId)
    return successResponse(res, { meetings }, 'Meetings fetched successfully')
  } catch (error) {
    next(error)
  }
}

export const updateSprintMeetingHandler = async (req, res, next) => {
  try {
    ensureManager(req.user)
    const meeting = await updateSprintMeeting({
      meetingId: req.params.meetingId,
      payload: req.body,
      actor: req.user,
      req,
    })
    return successResponse(res, { meeting }, 'Meeting updated successfully')
  } catch (error) {
    next(error)
  }
}

export const deleteSprintMeetingHandler = async (req, res, next) => {
  try {
    ensureManager(req.user)
    await deleteSprintMeeting({
      meetingId: req.params.meetingId,
      actor: req.user,
      req,
    })
    return successResponse(res, null, 'Meeting cancelled successfully')
  } catch (error) {
    next(error)
  }
}

export const addMeetingAgendaItemHandler = async (req, res, next) => {
  try {
    ensureManager(req.user)
    const meeting = await addMeetingAgendaItem({
      meetingId: req.params.meetingId,
      item: req.body,
      actor: req.user,
      req,
    })
    return successResponse(res, { meeting }, 'Agenda updated successfully')
  } catch (error) {
    next(error)
  }
}

export const addMeetingNoteHandler = async (req, res, next) => {
  try {
    const meeting = await addMeetingNote({
      meetingId: req.params.meetingId,
      content: req.body.content,
      author: req.user,
      req,
    })
    return successResponse(res, { meeting }, 'Note added successfully')
  } catch (error) {
    next(error)
  }
}

export const resendMeetingInvitesHandler = async (req, res, next) => {
  try {
    ensureManager(req.user)
    const meeting = await resendMeetingInvites({
      meetingId: req.params.meetingId,
      actor: req.user,
    })
    return successResponse(res, { meeting }, 'Invites resent successfully')
  } catch (error) {
    next(error)
  }
}

