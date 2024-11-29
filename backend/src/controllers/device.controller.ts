import { Request, Response } from 'express';
import Device, { IDevice } from '../models/device.model';

export class DeviceController {
  // Get all devices with pagination and filtering
  public async getDevices(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const type = req.query.type;
      const isOnline = req.query.isOnline;
      
      const query: any = {};
      if (type) query.type = type;
      if (isOnline !== undefined) query['status.isOnline'] = isOnline === 'true';

      const devices = await Device.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await Device.countDocuments(query);

      res.json({
        devices,
        page,
        totalPages: Math.ceil(total / limit),
        total
      });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching devices' });
    }
  }

  // Get device by ID
  public async getDevice(req: Request, res: Response): Promise<void> {
    try {
      const device = await Device.findById(req.params.id);
      if (!device) {
        res.status(404).json({ error: 'Device not found' });
        return;
      }
      res.json(device);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching device' });
    }
  }

  // Create new device
  public async createDevice(req: Request, res: Response): Promise<void> {
    try {
      const device = new Device(req.body);
      await device.save();
      res.status(201).json(device);
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(400).json({ error: 'Device name must be unique' });
        return;
      }
      res.status(500).json({ error: 'Error creating device' });
    }
  }

  // Update device
  public async updateDevice(req: Request, res: Response): Promise<void> {
    try {
      const device = await Device.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!device) {
        res.status(404).json({ error: 'Device not found' });
        return;
      }
      res.json(device);
    } catch (error) {
      res.status(500).json({ error: 'Error updating device' });
    }
  }

  // Delete device
  public async deleteDevice(req: Request, res: Response): Promise<void> {
    try {
      const device = await Device.findByIdAndDelete(req.params.id);
      if (!device) {
        res.status(404).json({ error: 'Device not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Error deleting device' });
    }
  }

  // Update device status
  public async updateDeviceStatus(req: Request, res: Response): Promise<void> {
    try {
      const { batteryLevel, isOnline, isCharging, signalStrength } = req.body;
      
      const device = await Device.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            batteryLevel,
            'status.isOnline': isOnline,
            'status.isCharging': isCharging,
            'status.signalStrength': signalStrength,
            'status.lastUpdated': new Date(),
            lastSeen: new Date()
          }
        },
        { new: true }
      );

      if (!device) {
        res.status(404).json({ error: 'Device not found' });
        return;
      }
      res.json(device);
    } catch (error) {
      res.status(500).json({ error: 'Error updating device status' });
    }
  }

  // Get device statistics
  public async getDeviceStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await Device.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            online: {
              $sum: { $cond: [{ $eq: ['$status.isOnline', true] }, 1, 0] }
            },
            offline: {
              $sum: { $cond: [{ $eq: ['$status.isOnline', false] }, 1, 0] }
            },
            charging: {
              $sum: { $cond: [{ $eq: ['$status.isCharging', true] }, 1, 0] }
            },
            avgBattery: { $avg: '$batteryLevel' },
            byType: {
              $push: {
                type: '$type',
                count: 1
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            total: 1,
            online: 1,
            offline: 1,
            charging: 1,
            avgBattery: { $round: ['$avgBattery', 1] },
            byType: {
              $reduce: {
                input: '$byType',
                initialValue: {},
                in: {
                  $mergeObjects: [
                    '$$value',
                    { ['$$this.type']: { $add: [{ $ifNull: ['$$value.$$this.type', 0] }, 1] } }
                  ]
                }
              }
            }
          }
        }
      ]);

      res.json(stats[0] || {
        total: 0,
        online: 0,
        offline: 0,
        charging: 0,
        avgBattery: 0,
        byType: {}
      });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching device statistics' });
    }
  }
}
