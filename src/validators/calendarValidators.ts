import { body, param, query } from 'express-validator';
import { EVENT_TYPES, REPEAT_FREQUENCIES } from '../config/constants';

export const createEventValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),

  body('type')
    .notEmpty()
    .withMessage('Event type is required')
    .isIn(EVENT_TYPES)
    .withMessage(`Event type must be one of: ${EVENT_TYPES.join(', ')}`),

  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be in ISO 8601 format (YYYY-MM-DD)'),

  body('time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in HH:MM format'),

  body('repeat')
    .optional()
    .isObject()
    .withMessage('Repeat must be an object'),

  body('repeat.frequency')
    .if(body('repeat').exists())
    .isIn(REPEAT_FREQUENCIES)
    .withMessage(`Repeat frequency must be one of: ${REPEAT_FREQUENCIES.join(', ')}`),

  body('repeat.interval')
    .if(body('repeat').exists())
    .isInt({ min: 1 })
    .withMessage('Repeat interval must be a positive integer'),

  body('repeat.endDate')
    .if(body('repeat').exists())
    .isISO8601()
    .withMessage('Repeat end date must be in ISO 8601 format'),

  body('repeat.count')
    .if(body('repeat').exists())
    .isInt({ min: 1 })
    .withMessage('Repeat count must be a positive integer'),
];

export const updateEventValidation = [
  param('id')
    .notEmpty()
    .withMessage('Event ID is required'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),

  body('type')
    .optional()
    .isIn(EVENT_TYPES)
    .withMessage(`Event type must be one of: ${EVENT_TYPES.join(', ')}`),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in ISO 8601 format (YYYY-MM-DD)'),

  body('time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in HH:MM format'),
];

export const deleteEventValidation = [
  param('id')
    .notEmpty()
    .withMessage('Event ID is required'),
];

export const bulkDeleteValidation = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('IDs must be a non-empty array'),

  body('ids.*')
    .isString()
    .withMessage('Each ID must be a string'),
];

export const getEventsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO 8601 format'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO 8601 format'),

  query('type')
    .optional()
    .isIn(EVENT_TYPES)
    .withMessage(`Type must be one of: ${EVENT_TYPES.join(', ')}`),
];