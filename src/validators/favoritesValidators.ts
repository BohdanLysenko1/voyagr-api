import { body, param } from 'express-validator';

export const addFavoriteValidation = [
  body('dealId')
    .notEmpty()
    .withMessage('Deal ID is required')
    .isString()
    .withMessage('Deal ID must be a string'),

  body('dealType')
    .notEmpty()
    .withMessage('Deal type is required')
    .isIn(['flight', 'hotel', 'package', 'restaurant'])
    .withMessage('Deal type must be one of: flight, hotel, package, restaurant'),

  body('dealData')
    .notEmpty()
    .withMessage('Deal data is required')
    .isObject()
    .withMessage('Deal data must be an object'),
];

export const removeFavoriteValidation = [
  param('id')
    .notEmpty()
    .withMessage('Favorite ID is required'),
];