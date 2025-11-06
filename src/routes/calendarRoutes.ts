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
 * @swagger
 * /api/calendar/events:
 *   get:
 *     summary: Get calendar events
 *     tags: [Calendar]
 *     description: Retrieve all calendar events for authenticated user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-12-01"
 *         description: Filter events from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-12-31"
 *         description: Filter events until this date
 *     responses:
 *       200:
 *         description: Calendar events retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CalendarEvent'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/calendar/events:
 *   post:
 *     summary: Create calendar event
 *     tags: [Calendar]
 *     description: Create a new calendar event
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CalendarEvent'
 *           example:
 *             title: Flight to Paris
 *             description: Departure from JFK
 *             startDate: "2025-12-01T10:00:00Z"
 *             endDate: "2025-12-01T14:00:00Z"
 *             location: JFK Airport
 *             category: flight
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CalendarEvent'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/calendar/events/{id}:
 *   delete:
 *     summary: Delete calendar event
 *     tags: [Calendar]
 *     description: Delete a calendar event by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: event123
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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