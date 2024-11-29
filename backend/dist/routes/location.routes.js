"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const location_controller_1 = require("../controllers/location.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const joi_1 = __importDefault(require("joi"));
const auth_middleware_2 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Validation schemas
const locationUpdateSchema = joi_1.default.object({
    latitude: joi_1.default.number().required().min(-90).max(90),
    longitude: joi_1.default.number().required().min(-180).max(180),
    accuracy: joi_1.default.number().optional(),
    speed: joi_1.default.number().optional(),
    altitude: joi_1.default.number().optional()
});
const locationHistoryQuerySchema = joi_1.default.object({
    startDate: joi_1.default.date().iso().optional(),
    endDate: joi_1.default.date().iso().optional(),
});
const shareLocationSchema = joi_1.default.object({
    shareWith: joi_1.default.array().items(joi_1.default.string().email()).required(),
    duration: joi_1.default.number().required().min(300).max(86400) // Between 5 minutes and 24 hours in seconds
});
// Routes
router.post('/update', auth_middleware_1.authenticateToken, (0, auth_middleware_2.validateRequest)(locationUpdateSchema), location_controller_1.updateLocation);
router.get('/history', auth_middleware_1.authenticateToken, (0, auth_middleware_2.validateRequest)(locationHistoryQuerySchema), location_controller_1.getLocationHistory);
router.get('/last', auth_middleware_1.authenticateToken, location_controller_1.getLastKnownLocation);
router.post('/share', auth_middleware_1.authenticateToken, (0, auth_middleware_2.validateRequest)(shareLocationSchema), location_controller_1.shareLocation);
exports.default = router;
