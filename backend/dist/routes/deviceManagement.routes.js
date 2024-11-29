"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const deviceManagement_controller_1 = require("../controllers/deviceManagement.controller");
const router = (0, express_1.Router)();
// Device registration and management
router.post('/register', auth_middleware_1.authenticateToken, deviceManagement_controller_1.registerDevice);
router.post('/:deviceId/connect', auth_middleware_1.authenticateToken, deviceManagement_controller_1.connectDevice);
router.post('/:deviceId/disconnect', auth_middleware_1.authenticateToken, deviceManagement_controller_1.disconnectDevice);
// Device status and monitoring
router.get('/:deviceId/status', auth_middleware_1.authenticateToken, deviceManagement_controller_1.getDeviceStatus);
router.get('/all', auth_middleware_1.authenticateToken, deviceManagement_controller_1.getAllDevices);
router.get('/connected', auth_middleware_1.authenticateToken, deviceManagement_controller_1.getConnectedDevices);
router.post('/:deviceId/monitoring/start', auth_middleware_1.authenticateToken, deviceManagement_controller_1.startMonitoring);
router.post('/:deviceId/monitoring/stop', auth_middleware_1.authenticateToken, deviceManagement_controller_1.stopMonitoring);
exports.default = router;
