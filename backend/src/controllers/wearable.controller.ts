import { Request, Response } from 'express';
import WearableData from '../models/WearableData';
import User from '../models/User';
import WearableService from '../services/wearable.service';

export const registerDevice = async (req: Request, res: Response) => {
  try {
    const { deviceId, deviceType } = req.body;
    const userId = req.user._id;

    // Check if device is already registered
    const existingDevice = await User.findOne({
      _id: userId,
      'trustedDevices.deviceId': deviceId
    });

    if (existingDevice) {
      return res.status(400).json({ message: 'Device already registered' });
    }

    // Add device to user's trusted devices
    await User.findByIdAndUpdate(userId, {
      $push: {
        trustedDevices: {
          deviceId,
          deviceName: deviceType,
          lastSync: new Date()
        }
      }
    });

    res.status(201).json({
      message: 'Device registered successfully',
      deviceId,
      deviceType
    });
  } catch (error) {
    console.error('Register device error:', error);
    res.status(500).json({ message: 'Error registering device' });
  }
};

export const updateHealthData = async (req: Request, res: Response) => {
  try {
    const { deviceId, healthData, location, batteryLevel } = req.body;
    const userId = req.user._id;

    // Verify device is registered to user
    const user = await User.findOne({
      _id: userId,
      'trustedDevices.deviceId': deviceId
    });

    if (!user) {
      return res.status(403).json({ message: 'Device not registered to user' });
    }

    // Update device's last sync time
    await User.updateOne(
      { _id: userId, 'trustedDevices.deviceId': deviceId },
      { $set: { 'trustedDevices.$.lastSync': new Date() } }
    );

    // Create new wearable data entry
    const wearableData = new WearableData({
      userId,
      deviceId,
      deviceType: user.trustedDevices.find(d => d.deviceId === deviceId)?.deviceName,
      healthData,
      location,
      batteryLevel,
      timestamp: new Date()
    });

    await wearableData.save();

    // Process health data for potential alerts
    const alertStatus = await WearableService.processHealthData(
      userId.toString(),
      deviceId,
      healthData
    );

    // If there's an alert, emit it through WebSocket
    if (alertStatus.alert) {
      req.app.get('io').emit(`health-alert-${userId}`, {
        type: alertStatus.type,
        message: alertStatus.message,
        deviceId,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      message: 'Health data updated successfully',
      alert: alertStatus
    });
  } catch (error) {
    console.error('Update health data error:', error);
    res.status(500).json({ message: 'Error updating health data' });
  }
};

export const getDeviceData = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user._id;

    // Verify device belongs to user
    const user = await User.findOne({
      _id: userId,
      'trustedDevices.deviceId': deviceId
    });

    if (!user) {
      return res.status(403).json({ message: 'Device not registered to user' });
    }

    // Get device statistics
    const stats = await WearableService.getDeviceStats(deviceId, userId.toString());

    // Get latest health data
    const latestData = await WearableData.findOne({ userId, deviceId })
      .sort({ timestamp: -1 });

    res.json({
      stats,
      latestData,
      device: user.trustedDevices.find(d => d.deviceId === deviceId)
    });
  } catch (error) {
    console.error('Get device data error:', error);
    res.status(500).json({ message: 'Error fetching device data' });
  }
};

export const getHealthHistory = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate, metric } = req.query;
    const userId = req.user._id;

    // Verify device belongs to user
    const user = await User.findOne({
      _id: userId,
      'trustedDevices.deviceId': deviceId
    });

    if (!user) {
      return res.status(403).json({ message: 'Device not registered to user' });
    }

    const query: any = {
      userId,
      deviceId,
      timestamp: {}
    };

    if (startDate) {
      query.timestamp.$gte = new Date(startDate as string);
    }
    if (endDate) {
      query.timestamp.$lte = new Date(endDate as string);
    }

    // Build projection based on requested metric
    const projection: any = {
      timestamp: 1
    };
    if (metric) {
      projection[`healthData.${metric}`] = 1;
    } else {
      projection.healthData = 1;
    }

    const history = await WearableData.find(query, projection)
      .sort({ timestamp: -1 })
      .limit(1000);

    res.json(history);
  } catch (error) {
    console.error('Get health history error:', error);
    res.status(500).json({ message: 'Error fetching health history' });
  }
};
