"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wearable_controller_1 = require("../controllers/wearable.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const joi_1 = __importDefault(require("joi"));
const auth_middleware_2 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Validation schemas
const registerDeviceSchema = joi_1.default.object({
    deviceId: joi_1.default.string().required(),
    deviceType: joi_1.default.string()
        .required()
        .valid('SMARTWATCH', 'FITNESS_TRACKER', 'MEDICAL_DEVICE', 'OTHER')
});
const healthDataSchema = joi_1.default.object({
    deviceId: joi_1.default.string().required(),
    healthData: joi_1.default.object({
        heartRate: joi_1.default.number().min(0).max(250),
        bloodOxygen: joi_1.default.number().min(0).max(100),
        steps: joi_1.default.number().min(0),
        calories: joi_1.default.number().min(0),
        distance: joi_1.default.number().min(0),
        fallDetected: joi_1.default.boolean(),
        activity: joi_1.default.string().valid('IDLE', 'WALKING', 'RUNNING', 'SLEEPING', 'OTHER'),
        sleepData: joi_1.default.object({
            startTime: joi_1.default.date(),
            endTime: joi_1.default.date(),
            quality: joi_1.default.string().valid('POOR', 'FAIR', 'GOOD', 'EXCELLENT'),
            duration: joi_1.default.number().min(0)
        })
    }).required(),
    location: joi_1.default.object({
        latitude: joi_1.default.number().min(-90).max(90),
        longitude: joi_1.default.number().min(-180).max(180),
        accuracy: joi_1.default.number().min(0)
    }),
    batteryLevel: joi_1.default.number().min(0).max(100)
});
const healthHistoryQuerySchema = joi_1.default.object({
    startDate: joi_1.default.date().iso().optional(),
    endDate: joi_1.default.date().iso().optional(),
    metric: joi_1.default.string().valid('heartRate', 'bloodOxygen', 'steps', 'calories', 'distance', 'activity').optional()
});
// Routes
router.post('/register', auth_middleware_1.authenticateToken, (0, auth_middleware_2.validateRequest)(registerDeviceSchema), wearable_controller_1.registerDevice);
router.post('/health-data', auth_middleware_1.authenticateToken, (0, auth_middleware_2.validateRequest)(healthDataSchema), wearable_controller_1.updateHealthData);
router.get('/device/:deviceId', auth_middleware_1.authenticateToken, wearable_controller_1.getDeviceData);
router.get('/device/:deviceId/history', auth_middleware_1.authenticateToken, (0, auth_middleware_2.validateRequest)(healthHistoryQuerySchema), wearable_controller_1.getHealthHistory);
exports.default = router;
