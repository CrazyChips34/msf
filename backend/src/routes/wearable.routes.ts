import { Router } from 'express';
import {
  registerDevice,
  updateHealthData,
  getDeviceData,
  getHealthHistory
} from '../controllers/wearable.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import Joi from 'joi';
import { validateRequest } from '../middleware/auth.middleware';

const router = Router();

// Validation schemas
const registerDeviceSchema = Joi.object({
  deviceId: Joi.string().required(),
  deviceType: Joi.string()
    .required()
    .valid('SMARTWATCH', 'FITNESS_TRACKER', 'MEDICAL_DEVICE', 'OTHER')
});

const healthDataSchema = Joi.object({
  deviceId: Joi.string().required(),
  healthData: Joi.object({
    heartRate: Joi.number().min(0).max(250),
    bloodOxygen: Joi.number().min(0).max(100),
    steps: Joi.number().min(0),
    calories: Joi.number().min(0),
    distance: Joi.number().min(0),
    fallDetected: Joi.boolean(),
    activity: Joi.string().valid('IDLE', 'WALKING', 'RUNNING', 'SLEEPING', 'OTHER'),
    sleepData: Joi.object({
      startTime: Joi.date(),
      endTime: Joi.date(),
      quality: Joi.string().valid('POOR', 'FAIR', 'GOOD', 'EXCELLENT'),
      duration: Joi.number().min(0)
    })
  }).required(),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    accuracy: Joi.number().min(0)
  }),
  batteryLevel: Joi.number().min(0).max(100)
});

const healthHistoryQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  metric: Joi.string().valid(
    'heartRate',
    'bloodOxygen',
    'steps',
    'calories',
    'distance',
    'activity'
  ).optional()
});

// Routes
router.post(
  '/register',
  authenticateToken,
  validateRequest(registerDeviceSchema),
  registerDevice
);

router.post(
  '/health-data',
  authenticateToken,
  validateRequest(healthDataSchema),
  updateHealthData
);

router.get(
  '/device/:deviceId',
  authenticateToken,
  getDeviceData
);

router.get(
  '/device/:deviceId/history',
  authenticateToken,
  validateRequest(healthHistoryQuerySchema),
  getHealthHistory
);

export default router;
