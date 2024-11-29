"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthHistory = exports.getDeviceData = exports.updateHealthData = exports.registerDevice = void 0;
const WearableData_1 = __importDefault(require("../models/WearableData"));
const User_1 = __importDefault(require("../models/User"));
const wearable_service_1 = __importDefault(require("../services/wearable.service"));
const registerDevice = async (req, res) => {
    try {
        const { deviceId, deviceType } = req.body;
        const userId = req.user._id;
        // Check if device is already registered
        const existingDevice = await User_1.default.findOne({
            _id: userId,
            'trustedDevices.deviceId': deviceId
        });
        if (existingDevice) {
            return res.status(400).json({ message: 'Device already registered' });
        }
        // Add device to user's trusted devices
        await User_1.default.findByIdAndUpdate(userId, {
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
    }
    catch (error) {
        console.error('Register device error:', error);
        res.status(500).json({ message: 'Error registering device' });
    }
};
exports.registerDevice = registerDevice;
const updateHealthData = async (req, res) => {
    var _a;
    try {
        const { deviceId, healthData, location, batteryLevel } = req.body;
        const userId = req.user._id;
        // Verify device is registered to user
        const user = await User_1.default.findOne({
            _id: userId,
            'trustedDevices.deviceId': deviceId
        });
        if (!user) {
            return res.status(403).json({ message: 'Device not registered to user' });
        }
        // Update device's last sync time
        await User_1.default.updateOne({ _id: userId, 'trustedDevices.deviceId': deviceId }, { $set: { 'trustedDevices.$.lastSync': new Date() } });
        // Create new wearable data entry
        const wearableData = new WearableData_1.default({
            userId,
            deviceId,
            deviceType: (_a = user.trustedDevices.find(d => d.deviceId === deviceId)) === null || _a === void 0 ? void 0 : _a.deviceName,
            healthData,
            location,
            batteryLevel,
            timestamp: new Date()
        });
        await wearableData.save();
        // Process health data for potential alerts
        const alertStatus = await wearable_service_1.default.processHealthData(userId.toString(), deviceId, healthData);
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
    }
    catch (error) {
        console.error('Update health data error:', error);
        res.status(500).json({ message: 'Error updating health data' });
    }
};
exports.updateHealthData = updateHealthData;
const getDeviceData = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const userId = req.user._id;
        // Verify device belongs to user
        const user = await User_1.default.findOne({
            _id: userId,
            'trustedDevices.deviceId': deviceId
        });
        if (!user) {
            return res.status(403).json({ message: 'Device not registered to user' });
        }
        // Get device statistics
        const stats = await wearable_service_1.default.getDeviceStats(deviceId, userId.toString());
        // Get latest health data
        const latestData = await WearableData_1.default.findOne({ userId, deviceId })
            .sort({ timestamp: -1 });
        res.json({
            stats,
            latestData,
            device: user.trustedDevices.find(d => d.deviceId === deviceId)
        });
    }
    catch (error) {
        console.error('Get device data error:', error);
        res.status(500).json({ message: 'Error fetching device data' });
    }
};
exports.getDeviceData = getDeviceData;
const getHealthHistory = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate, metric } = req.query;
        const userId = req.user._id;
        // Verify device belongs to user
        const user = await User_1.default.findOne({
            _id: userId,
            'trustedDevices.deviceId': deviceId
        });
        if (!user) {
            return res.status(403).json({ message: 'Device not registered to user' });
        }
        const query = {
            userId,
            deviceId,
            timestamp: {}
        };
        if (startDate) {
            query.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
            query.timestamp.$lte = new Date(endDate);
        }
        // Build projection based on requested metric
        const projection = {
            timestamp: 1
        };
        if (metric) {
            projection[`healthData.${metric}`] = 1;
        }
        else {
            projection.healthData = 1;
        }
        const history = await WearableData_1.default.find(query, projection)
            .sort({ timestamp: -1 })
            .limit(1000);
        res.json(history);
    }
    catch (error) {
        console.error('Get health history error:', error);
        res.status(500).json({ message: 'Error fetching health history' });
    }
};
exports.getHealthHistory = getHealthHistory;
