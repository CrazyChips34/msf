"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emergency_controller_1 = require("../controllers/emergency.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const joi_1 = __importDefault(require("joi"));
const auth_middleware_2 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Validation schemas
const emergencyAlertSchema = joi_1.default.object({
    alertType: joi_1.default.string()
        .required()
        .valid('SOS', 'FALL_DETECTED', 'HEALTH_ALERT', 'JOURNEY_ALERT', 'GEOFENCE_BREACH'),
    latitude: joi_1.default.number().required().min(-90).max(90),
    longitude: joi_1.default.number().required().min(-180).max(180),
    healthData: joi_1.default.object({
        heartRate: joi_1.default.number(),
        fallDetected: joi_1.default.boolean(),
    }).optional(),
    description: joi_1.default.string().optional()
});
const updateAlertStatusSchema = joi_1.default.object({
    status: joi_1.default.string()
        .required()
        .valid('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')
});
const alertHistoryQuerySchema = joi_1.default.object({
    startDate: joi_1.default.date().iso().optional(),
    endDate: joi_1.default.date().iso().optional()
});
// Routes
router.post('/alert', auth_middleware_1.authenticateToken, (0, auth_middleware_2.validateRequest)(emergencyAlertSchema), emergency_controller_1.createEmergencyAlert);
router.put('/alert/:alertId/status', auth_middleware_1.authenticateToken, (0, auth_middleware_2.validateRequest)(updateAlertStatusSchema), emergency_controller_1.updateAlertStatus);
router.get('/alerts/active', auth_middleware_1.authenticateToken, emergency_controller_1.getActiveAlerts);
router.get('/alerts/history', auth_middleware_1.authenticateToken, (0, auth_middleware_2.validateRequest)(alertHistoryQuerySchema), emergency_controller_1.getAlertHistory);
exports.default = router;
