import { Request, Response } from 'express';
import { DeviceManagementService } from '../services/deviceManagement.service';
import { DeviceConfig } from '../interfaces/device.interface';
import Joi from 'joi';

const deviceService = new DeviceManagementService();

// Validation schemas
const deviceConfigSchema = Joi.object({
  deviceId: Joi.string().required(),
  deviceName: Joi.string(),
  deviceType: Joi.string().required().valid(
    'APPLE_HEALTH',
    'GOOGLE_FIT',
    'ANIMAL_EAR_TRACKER',
    'NECKLACE_TRACKER',
    'CUSTOM'
  ),
  manufacturer: Joi.string().required(),
  model: Joi.string(),
  serviceUUIDs: Joi.array().items(Joi.string()),
  updateInterval: Joi.number().min(1000),
  characteristics: Joi.object({
    location: Joi.object({
      serviceUUID: Joi.string().required(),
      characteristicUUID: Joi.string().required()
    }),
    battery: Joi.object({
      serviceUUID: Joi.string().required(),
      characteristicUUID: Joi.string().required()
    }),
    vitals: Joi.object({
      serviceUUID: Joi.string().required(),
      characteristicUUID: Joi.string().required()
    })
  }),
  thresholds: Joi.object({
    heartRate: Joi.object({
      min: Joi.number().min(0),
      max: Joi.number().min(0)
    }),
    temperature: Joi.object({
      min: Joi.number(),
      max: Joi.number()
    }),
    batteryLevel: Joi.number().min(0).max(100),
    inactivityPeriod: Joi.number().min(0)
  }),
  alerts: Joi.object({
    lowBattery: Joi.boolean(),
    disconnection: Joi.boolean(),
    healthWarnings: Joi.boolean(),
    inactivity: Joi.boolean(),
    geofence: Joi.boolean()
  })
});

export const registerDevice = async (req: Request, res: Response) => {
  try {
    const { error, value } = deviceConfigSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const config: DeviceConfig = value;
    const success = await deviceService.registerDevice(config);

    if (success) {
      res.status(201).json({ message: 'Device registered successfully', deviceId: config.deviceId });
    } else {
      res.status(400).json({ error: 'Failed to register device' });
    }
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const connectDevice = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const credentials = req.body.credentials;

    const success = await deviceService.connectDevice(deviceId, credentials);

    if (success) {
      res.json({ message: 'Device connected successfully' });
    } else {
      res.status(400).json({ error: 'Failed to connect device' });
    }
  } catch (error) {
    console.error('Error connecting device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const disconnectDevice = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const success = await deviceService.disconnectDevice(deviceId);

    if (success) {
      res.json({ message: 'Device disconnected successfully' });
    } else {
      res.status(400).json({ error: 'Failed to disconnect device' });
    }
  } catch (error) {
    console.error('Error disconnecting device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDeviceStatus = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const status = await deviceService.getDeviceStatus(deviceId);

    if (status) {
      res.json(status);
    } else {
      res.status(404).json({ error: 'Device not found' });
    }
  } catch (error) {
    console.error('Error getting device status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllDevices = async (req: Request, res: Response) => {
  try {
    const devices = await deviceService.getAllDevices();
    res.json(devices);
  } catch (error) {
    console.error('Error getting all devices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getConnectedDevices = async (req: Request, res: Response) => {
  try {
    const devices = await deviceService.getConnectedDevices();
    res.json(devices);
  } catch (error) {
    console.error('Error getting connected devices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const startMonitoring = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const success = await deviceService.startMonitoring(deviceId);

    if (success) {
      res.json({ message: 'Device monitoring started successfully' });
    } else {
      res.status(400).json({ error: 'Failed to start device monitoring' });
    }
  } catch (error) {
    console.error('Error starting device monitoring:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const stopMonitoring = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const success = await deviceService.stopMonitoring(deviceId);

    if (success) {
      res.json({ message: 'Device monitoring stopped successfully' });
    } else {
      res.status(400).json({ error: 'Failed to stop device monitoring' });
    }
  } catch (error) {
    console.error('Error stopping device monitoring:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
