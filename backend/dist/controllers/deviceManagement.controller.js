"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopMonitoring = exports.startMonitoring = exports.getConnectedDevices = exports.getAllDevices = exports.getDeviceStatus = exports.disconnectDevice = exports.connectDevice = exports.registerDevice = void 0;
const deviceManagement_service_1 = require("../services/deviceManagement.service");
const joi_1 = __importDefault(require("joi"));
const deviceService = new deviceManagement_service_1.DeviceManagementService();
// Validation schemas
const deviceConfigSchema = joi_1.default.object({
    deviceId: joi_1.default.string().required(),
    deviceName: joi_1.default.string(),
    deviceType: joi_1.default.string().required().valid('APPLE_HEALTH', 'GOOGLE_FIT', 'ANIMAL_EAR_TRACKER', 'NECKLACE_TRACKER', 'CUSTOM'),
    manufacturer: joi_1.default.string().required(),
    model: joi_1.default.string(),
    serviceUUIDs: joi_1.default.array().items(joi_1.default.string()),
    updateInterval: joi_1.default.number().min(1000),
    characteristics: joi_1.default.object({
        location: joi_1.default.object({
            serviceUUID: joi_1.default.string().required(),
            characteristicUUID: joi_1.default.string().required()
        }),
        battery: joi_1.default.object({
            serviceUUID: joi_1.default.string().required(),
            characteristicUUID: joi_1.default.string().required()
        }),
        vitals: joi_1.default.object({
            serviceUUID: joi_1.default.string().required(),
            characteristicUUID: joi_1.default.string().required()
        })
    }),
    thresholds: joi_1.default.object({
        heartRate: joi_1.default.object({
            min: joi_1.default.number().min(0),
            max: joi_1.default.number().min(0)
        }),
        temperature: joi_1.default.object({
            min: joi_1.default.number(),
            max: joi_1.default.number()
        }),
        batteryLevel: joi_1.default.number().min(0).max(100),
        inactivityPeriod: joi_1.default.number().min(0)
    }),
    alerts: joi_1.default.object({
        lowBattery: joi_1.default.boolean(),
        disconnection: joi_1.default.boolean(),
        healthWarnings: joi_1.default.boolean(),
        inactivity: joi_1.default.boolean(),
        geofence: joi_1.default.boolean()
    })
});
const registerDevice = async (req, res) => {
    try {
        const { error, value } = deviceConfigSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const config = value;
        const success = await deviceService.registerDevice(config);
        if (success) {
            res.status(201).json({ message: 'Device registered successfully', deviceId: config.deviceId });
        }
        else {
            res.status(400).json({ error: 'Failed to register device' });
        }
    }
    catch (error) {
        console.error('Error registering device:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.registerDevice = registerDevice;
const connectDevice = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const credentials = req.body.credentials;
        const success = await deviceService.connectDevice(deviceId, credentials);
        if (success) {
            res.json({ message: 'Device connected successfully' });
        }
        else {
            res.status(400).json({ error: 'Failed to connect device' });
        }
    }
    catch (error) {
        console.error('Error connecting device:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.connectDevice = connectDevice;
const disconnectDevice = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const success = await deviceService.disconnectDevice(deviceId);
        if (success) {
            res.json({ message: 'Device disconnected successfully' });
        }
        else {
            res.status(400).json({ error: 'Failed to disconnect device' });
        }
    }
    catch (error) {
        console.error('Error disconnecting device:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.disconnectDevice = disconnectDevice;
const getDeviceStatus = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const status = await deviceService.getDeviceStatus(deviceId);
        if (status) {
            res.json(status);
        }
        else {
            res.status(404).json({ error: 'Device not found' });
        }
    }
    catch (error) {
        console.error('Error getting device status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getDeviceStatus = getDeviceStatus;
const getAllDevices = async (req, res) => {
    try {
        const devices = await deviceService.getAllDevices();
        res.json(devices);
    }
    catch (error) {
        console.error('Error getting all devices:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllDevices = getAllDevices;
const getConnectedDevices = async (req, res) => {
    try {
        const devices = await deviceService.getConnectedDevices();
        res.json(devices);
    }
    catch (error) {
        console.error('Error getting connected devices:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getConnectedDevices = getConnectedDevices;
const startMonitoring = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const success = await deviceService.startMonitoring(deviceId);
        if (success) {
            res.json({ message: 'Device monitoring started successfully' });
        }
        else {
            res.status(400).json({ error: 'Failed to start device monitoring' });
        }
    }
    catch (error) {
        console.error('Error starting device monitoring:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.startMonitoring = startMonitoring;
const stopMonitoring = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const success = await deviceService.stopMonitoring(deviceId);
        if (success) {
            res.json({ message: 'Device monitoring stopped successfully' });
        }
        else {
            res.status(400).json({ error: 'Failed to stop device monitoring' });
        }
    }
    catch (error) {
        console.error('Error stopping device monitoring:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.stopMonitoring = stopMonitoring;
