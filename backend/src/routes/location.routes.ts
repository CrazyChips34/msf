import { Router } from 'express';
import {
  updateLocation,
  getLocationHistory,
  getLastKnownLocation,
  shareLocation
} from '../controllers/location.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import Joi from 'joi';
import { validateRequest } from '../middleware/auth.middleware';

const router = Router();

// Validation schemas
const locationUpdateSchema = Joi.object({
  latitude: Joi.number().required().min(-90).max(90),
  longitude: Joi.number().required().min(-180).max(180),
  accuracy: Joi.number().optional(),
  speed: Joi.number().optional(),
  altitude: Joi.number().optional()
});

const locationHistoryQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

const shareLocationSchema = Joi.object({
  shareWith: Joi.array().items(Joi.string().email()).required(),
  duration: Joi.number().required().min(300).max(86400) // Between 5 minutes and 24 hours in seconds
});

// Routes
router.post(
  '/update',
  authenticateToken,
  validateRequest(locationUpdateSchema),
  updateLocation
);

router.get(
  '/history',
  authenticateToken,
  validateRequest(locationHistoryQuerySchema),
  getLocationHistory
);

router.get(
  '/last',
  authenticateToken,
  getLastKnownLocation
);

router.post(
  '/share',
  authenticateToken,
  validateRequest(shareLocationSchema),
  shareLocation
);

export default router;
