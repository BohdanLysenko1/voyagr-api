import { Response } from 'express';
import { getFirestore } from '../config/firebase';
import { AuthRequest, CalendarEvent, CreateCalendarEventInput, UpdateCalendarEventInput } from '../models/types';
import { COLLECTIONS, HTTP_STATUS } from '../config/constants';
import { AppError } from '../middleware/errorHandler';

const db = getFirestore();

/**
 * Get all calendar events for the authenticated user
 */
export const getEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const type = req.query.type as string;

    let query = db.collection(COLLECTIONS.CALENDAR_EVENTS)
      .where('userId', '==', userId);

    // Apply filters
    if (startDate) {
      query = query.where('date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('date', '<=', endDate);
    }
    if (type) {
      query = query.where('type', '==', type);
    }

    // Get total count
    const snapshot = await query.get();
    const total = snapshot.size;

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const events: CalendarEvent[] = [];

    snapshot.docs
      .slice(startIndex, startIndex + limit)
      .forEach(doc => {
        events.push({ id: doc.id, ...doc.data() } as CalendarEvent);
      });

    const totalPages = Math.ceil(total / limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        data: events,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error: any) {
    console.error('Get events error:', error);
    throw new AppError('Failed to fetch events', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get a single calendar event by ID
 */
export const getEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const eventId = req.params.id;

    const doc = await db.collection(COLLECTIONS.CALENDAR_EVENTS).doc(eventId).get();

    if (!doc.exists) {
      throw new AppError('Event not found', HTTP_STATUS.NOT_FOUND);
    }

    const event = { id: doc.id, ...doc.data() } as CalendarEvent;

    // Verify ownership
    if (event.userId !== userId) {
      throw new AppError('Forbidden: You do not have access to this event', HTTP_STATUS.FORBIDDEN);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: event,
    });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    console.error('Get event error:', error);
    throw new AppError('Failed to fetch event', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Create a new calendar event
 */
export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const eventData: CreateCalendarEventInput = req.body;

    const now = new Date().toISOString();
    const newEvent: Omit<CalendarEvent, 'id'> = {
      ...eventData,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection(COLLECTIONS.CALENDAR_EVENTS).add(newEvent);
    const doc = await docRef.get();
    const createdEvent = { id: doc.id, ...doc.data() } as CalendarEvent;

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: createdEvent,
      message: 'Event created successfully',
    });
  } catch (error: any) {
    console.error('Create event error:', error);
    throw new AppError('Failed to create event', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Update a calendar event
 */
export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const eventId = req.params.id;
    const updateData: UpdateCalendarEventInput = req.body;

    const docRef = db.collection(COLLECTIONS.CALENDAR_EVENTS).doc(eventId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new AppError('Event not found', HTTP_STATUS.NOT_FOUND);
    }

    const event = doc.data() as CalendarEvent;

    // Verify ownership
    if (event.userId !== userId) {
      throw new AppError('Forbidden: You do not have access to this event', HTTP_STATUS.FORBIDDEN);
    }

    const updatedData = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updatedData);

    const updatedDoc = await docRef.get();
    const updatedEvent = { id: updatedDoc.id, ...updatedDoc.data() } as CalendarEvent;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updatedEvent,
      message: 'Event updated successfully',
    });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    console.error('Update event error:', error);
    throw new AppError('Failed to update event', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Delete a calendar event
 */
export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const eventId = req.params.id;

    const docRef = db.collection(COLLECTIONS.CALENDAR_EVENTS).doc(eventId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new AppError('Event not found', HTTP_STATUS.NOT_FOUND);
    }

    const event = doc.data() as CalendarEvent;

    // Verify ownership
    if (event.userId !== userId) {
      throw new AppError('Forbidden: You do not have access to this event', HTTP_STATUS.FORBIDDEN);
    }

    await docRef.delete();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    console.error('Delete event error:', error);
    throw new AppError('Failed to delete event', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Delete multiple calendar events
 */
export const bulkDeleteEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const { ids } = req.body;

    const batch = db.batch();
    const failedIds: string[] = [];

    for (const id of ids) {
      const docRef = db.collection(COLLECTIONS.CALENDAR_EVENTS).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        failedIds.push(id);
        continue;
      }

      const event = doc.data() as CalendarEvent;

      // Verify ownership
      if (event.userId !== userId) {
        failedIds.push(id);
        continue;
      }

      batch.delete(docRef);
    }

    await batch.commit();

    const message = failedIds.length > 0
      ? `Events deleted. ${failedIds.length} event(s) could not be deleted (not found or unauthorized)`
      : 'All events deleted successfully';

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message,
      data: {
        deletedCount: ids.length - failedIds.length,
        failedIds,
      },
    });
  } catch (error: any) {
    console.error('Bulk delete events error:', error);
    throw new AppError('Failed to delete events', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};