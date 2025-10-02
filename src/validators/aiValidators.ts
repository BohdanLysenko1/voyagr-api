import { body } from 'express-validator';

export const aiPlanValidation = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),

  body('destination')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Destination must be less than 200 characters'),

  body('dates')
    .optional()
    .isObject()
    .withMessage('Dates must be an object'),

  body('dates.start')
    .if(body('dates').exists())
    .isISO8601()
    .withMessage('Start date must be in ISO 8601 format'),

  body('dates.end')
    .if(body('dates').exists())
    .isISO8601()
    .withMessage('End date must be in ISO 8601 format'),

  body('budget')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Budget must be less than 100 characters'),

  body('travelers')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Number of travelers must be between 1 and 50'),
];

export const aiChatValidation = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters'),

  body('chatHistory')
    .optional()
    .isArray()
    .withMessage('Chat history must be an array'),

  body('chatHistory.*.role')
    .if(body('chatHistory').exists())
    .isIn(['user', 'model'])
    .withMessage('Chat history role must be either "user" or "model"'),

  body('chatHistory.*.content')
    .if(body('chatHistory').exists())
    .trim()
    .notEmpty()
    .withMessage('Chat history content cannot be empty'),

  body('context')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Context must be less than 1000 characters'),
];