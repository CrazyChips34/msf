"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const device_controller_1 = require("../controllers/device.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const deviceController = new device_controller_1.DeviceController();
// Apply auth middleware to all routes
router.use(auth_middleware_1.authMiddleware);
// GET /api/devices - Get all devices with pagination and filtering
router.get('/', deviceController.getDevices);
// GET /api/devices/stats - Get device statistics
router.get('/stats', deviceController.getDeviceStats);
// GET /api/devices/:id - Get device by ID
router.get('/:id', deviceController.getDevice);
// POST /api/devices - Create new device
router.post('/', deviceController.createDevice);
// PUT /api/devices/:id - Update device
router.put('/:id', deviceController.updateDevice);
// DELETE /api/devices/:id - Delete device
router.delete('/:id', deviceController.deleteDevice);
// PUT /api/devices/:id/status - Update device status
router.put('/:id/status', deviceController.updateDeviceStatus);
exports.default = router;
