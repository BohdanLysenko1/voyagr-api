import { Router } from 'express';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  bulkDeleteEvents,
} from '../controllers/calendarController';
import { authenticateUser } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import {
  createEventValidation,
  updateEventValidation,
  deleteEventValidation,
  bulkDeleteValidation,
  getEventsValidation,
} from '../validators/calendarValidators';

const router = Router();

// All calendar routes require authentication
router.use(authenticateUser);

/**
 * @route   GET /calendar/events
 * @desc    Get all calendar events for authenticated user
 * @access  Private
 */
router.get(
  '/events',
  validate(getEventsValidation),
  asyncHandler(getEvents)
);

/**
 * @route   GET /calendar/events/:id
 * @desc    Get a single calendar event by ID
 * @access  Private
 */
router.get(
  '/events/:id',
  asyncHandler(getEvent)
);

/**
 * @route   POST /calendar/events
 * @desc    Create a new calendar event
 * @access  Private
 */
router.post(
  '/events',
  validate(createEventValidation),
  asyncHandler(createEvent)
);

/**
 * @route   PUT /calendar/events/:id
 * @desc    Update a calendar event
 * @access  Private
 */
router.put(
  '/events/:id',
  validate(updateEventValidation),
  asyncHandler(updateEvent)
);

/**
 * @route   DELETE /calendar/events/:id
 * @desc    Delete a calendar event
 * @access  Private
 */
router.delete(
  '/events/:id',
  validate(deleteEventValidation),
  asyncHandler(deleteEvent)
);

/**
 * @route   POST /calendar/events/bulk-delete
 * @desc    Delete multiple calendar events
 * @access  Private
 */
router.post(
  '/events/bulk-delete',
  validate(bulkDeleteValidation),
  asyncHandler(bulkDeleteEvents)
);

export default router;