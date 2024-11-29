import { Router } from 'express';
import {
  createEmergencyAlert,
  updateAlertStatus,
  getActiveAlerts,
  getAlertHistory
} from '../controllers/emergency.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import Joi from 'joi';
import { validateRequest } from '../middleware/auth.middleware';

const router = Router();

// Validation schemas
const emergencyAlertSchema = Joi.object({
  alertType: Joi.string()
    .required()
    .valid('SOS', 'FALL_DETECTED', 'HEALTH_ALERT', 'JOURNEY_ALERT', 'GEOFENCE_BREACH'),
  latitude: Joi.number().required().min(-90).max(90),
  longitude: Joi.number().required().min(-180).max(180),
  healthData: Joi.object({
    heartRate: Joi.number(),
    fallDetected: Joi.boolean(),
  }).optional(),
  description: Joi.string().optional()
});

const updateAlertStatusSchema = Joi.object({
  status: Joi.string()
    .required()
    .valid('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')
});

const alertHistoryQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional()
});

// Routes
router.post(
  '/alert',
  authenticateToken,
  validateRequest(emergencyAlertSchema),
  createEmergencyAlert
);

router.put(
  '/alert/:alertId/status',
  authenticateToken,
  validateRequest(updateAlertStatusSchema),
  updateAlertStatus
);

router.get(
  '/alerts/active',
  authenticateToken,
  getActiveAlerts
);

router.get(
  '/alerts/history',
  authenticateToken,
  validateRequest(alertHistoryQuerySchema),
  getAlertHistory
);

export default router;
