export const COLLECTIONS = {
  USERS: 'users',
  CALENDAR_EVENTS: 'calendar_events',
  FAVORITES: 'favorites',
  DEALS: 'deals',
} as const;

export const EVENT_TYPES = ['departure', 'arrival', 'event', 'urgent', 'meeting'] as const;

export const REPEAT_FREQUENCIES = ['never', 'daily', 'weekly', 'monthly', 'yearly', 'custom'] as const;

export const DEAL_TYPES = ['flight', 'hotel', 'package', 'restaurant'] as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;