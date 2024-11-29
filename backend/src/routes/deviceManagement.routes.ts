import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  registerDevice,
  connectDevice,
  disconnectDevice,
  getDeviceStatus,
  getAllDevices,
  getConnectedDevices,
  startMonitoring,
  stopMonitoring
} from '../controllers/deviceManagement.controller';

const router = Router();

// Device registration and management
router.post('/register', authenticateToken, registerDevice);
router.post('/:deviceId/connect', authenticateToken, connectDevice);
router.post('/:deviceId/disconnect', authenticateToken, disconnectDevice);

// Device status and monitoring
router.get('/:deviceId/status', authenticateToken, getDeviceStatus);
router.get('/all', authenticateToken, getAllDevices);
router.get('/connected', authenticateToken, getConnectedDevices);
router.post('/:deviceId/monitoring/start', authenticateToken, startMonitoring);
router.post('/:deviceId/monitoring/stop', authenticateToken, stopMonitoring);

export default router;
