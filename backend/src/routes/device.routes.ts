import { Router } from 'express';
import { DeviceController } from '../controllers/device.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const deviceController = new DeviceController();

// Apply auth middleware to all routes
router.use(authMiddleware);

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

export default router;
