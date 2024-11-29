"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceController = void 0;
const device_model_1 = __importDefault(require("../models/device.model"));
class DeviceController {
    // Get all devices with pagination and filtering
    async getDevices(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const type = req.query.type;
            const isOnline = req.query.isOnline;
            const query = {};
            if (type)
                query.type = type;
            if (isOnline !== undefined)
                query['status.isOnline'] = isOnline === 'true';
            const devices = await device_model_1.default.find(query)
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 });
            const total = await device_model_1.default.countDocuments(query);
            res.json({
                devices,
                page,
                totalPages: Math.ceil(total / limit),
                total
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Error fetching devices' });
        }
    }
    // Get device by ID
    async getDevice(req, res) {
        try {
            const device = await device_model_1.default.findById(req.params.id);
            if (!device) {
                res.status(404).json({ error: 'Device not found' });
                return;
            }
            res.json(device);
        }
        catch (error) {
            res.status(500).json({ error: 'Error fetching device' });
        }
    }
    // Create new device
    async createDevice(req, res) {
        try {
            const device = new device_model_1.default(req.body);
            await device.save();
            res.status(201).json(device);
        }
        catch (error) {
            if (error.code === 11000) {
                res.status(400).json({ error: 'Device name must be unique' });
                return;
            }
            res.status(500).json({ error: 'Error creating device' });
        }
    }
    // Update device
    async updateDevice(req, res) {
        try {
            const device = await device_model_1.default.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
            if (!device) {
                res.status(404).json({ error: 'Device not found' });
                return;
            }
            res.json(device);
        }
        catch (error) {
            res.status(500).json({ error: 'Error updating device' });
        }
    }
    // Delete device
    async deleteDevice(req, res) {
        try {
            const device = await device_model_1.default.findByIdAndDelete(req.params.id);
            if (!device) {
                res.status(404).json({ error: 'Device not found' });
                return;
            }
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: 'Error deleting device' });
        }
    }
    // Update device status
    async updateDeviceStatus(req, res) {
        try {
            const { batteryLevel, isOnline, isCharging, signalStrength } = req.body;
            const device = await device_model_1.default.findByIdAndUpdate(req.params.id, {
                $set: {
                    batteryLevel,
                    'status.isOnline': isOnline,
                    'status.isCharging': isCharging,
                    'status.signalStrength': signalStrength,
                    'status.lastUpdated': new Date(),
                    lastSeen: new Date()
                }
            }, { new: true });
            if (!device) {
                res.status(404).json({ error: 'Device not found' });
                return;
            }
            res.json(device);
        }
        catch (error) {
            res.status(500).json({ error: 'Error updating device status' });
        }
    }
    // Get device statistics
    async getDeviceStats(req, res) {
        try {
            const stats = await device_model_1.default.aggregate([
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
        }
        catch (error) {
            res.status(500).json({ error: 'Error fetching device statistics' });
        }
    }
}
exports.DeviceController = DeviceController;
