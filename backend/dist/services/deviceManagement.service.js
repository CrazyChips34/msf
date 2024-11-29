"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceManagementService = void 0;
const appleHealthKit_adapter_1 = require("../adapters/appleHealthKit.adapter");
const googleFit_adapter_1 = require("../adapters/googleFit.adapter");
const customDevice_adapter_1 = require("../adapters/customDevice.adapter");
const device_interface_1 = require("../interfaces/device.interface");
const events_1 = require("events");
class DeviceManagementService {
    constructor() {
        this.devices = new Map();
        this.deviceConfigs = new Map();
        this.deviceStatuses = new Map();
        this.eventEmitter = new events_1.EventEmitter();
        // Set up periodic device status checks
        setInterval(() => this.checkDeviceStatuses(), 60000);
    }
    async registerDevice(config) {
        try {
            const adapter = this.createDeviceAdapter(config);
            if (!adapter) {
                throw new Error(`Unsupported device type: ${config.deviceType}`);
            }
            // Store device configuration
            this.deviceConfigs.set(config.deviceId, config);
            this.devices.set(config.deviceId, adapter);
            // Initialize device status
            this.deviceStatuses.set(config.deviceId, {
                deviceId: config.deviceId,
                isConnected: false,
                batteryLevel: null,
                lastSyncTime: null,
                errors: [],
                healthStatus: 'UNKNOWN'
            });
            // Emit device registered event
            this.eventEmitter.emit('deviceRegistered', config);
            return true;
        }
        catch (error) {
            console.error('Failed to register device:', error);
            return false;
        }
    }
    createDeviceAdapter(config) {
        switch (config.deviceType) {
            case device_interface_1.DeviceType.APPLE_HEALTH:
                return new appleHealthKit_adapter_1.AppleHealthKitAdapter();
            case device_interface_1.DeviceType.GOOGLE_FIT:
                return new googleFit_adapter_1.GoogleFitAdapter();
            case device_interface_1.DeviceType.ANIMAL_EAR_TRACKER:
            case device_interface_1.DeviceType.NECKLACE_TRACKER:
            case device_interface_1.DeviceType.CUSTOM:
                return new customDevice_adapter_1.CustomDeviceAdapter(config);
            default:
                return null;
        }
    }
    async connectDevice(deviceId, credentials) {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new Error('Device not found');
        }
        try {
            const connected = await device.connect(credentials);
            if (connected) {
                const status = this.deviceStatuses.get(deviceId);
                if (status) {
                    status.isConnected = true;
                    status.lastSyncTime = new Date();
                    status.healthStatus = 'GOOD';
                    this.eventEmitter.emit('deviceConnected', deviceId);
                }
            }
            return connected;
        }
        catch (error) {
            console.error(`Failed to connect device ${deviceId}:`, error);
            this.updateDeviceError(deviceId, 'CONNECTION_FAILED', error.message);
            return false;
        }
    }
    async disconnectDevice(deviceId) {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new Error('Device not found');
        }
        try {
            const disconnected = await device.disconnect();
            if (disconnected) {
                const status = this.deviceStatuses.get(deviceId);
                if (status) {
                    status.isConnected = false;
                    this.eventEmitter.emit('deviceDisconnected', deviceId);
                }
            }
            return disconnected;
        }
        catch (error) {
            console.error(`Failed to disconnect device ${deviceId}:`, error);
            this.updateDeviceError(deviceId, 'DISCONNECT_FAILED', error.message);
            return false;
        }
    }
    async getDeviceStatus(deviceId) {
        return this.deviceStatuses.get(deviceId) || null;
    }
    async getAllDevices() {
        return Array.from(this.deviceConfigs.values());
    }
    async getConnectedDevices() {
        return Array.from(this.deviceConfigs.values()).filter(config => { var _a; return (_a = this.deviceStatuses.get(config.deviceId)) === null || _a === void 0 ? void 0 : _a.isConnected; });
    }
    async startMonitoring(deviceId) {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new Error('Device not found');
        }
        try {
            await device.startRealtimeUpdates(async (data) => {
                // Update device status with new health data
                const status = this.deviceStatuses.get(deviceId);
                if (status) {
                    status.lastSyncTime = new Date();
                    status.healthStatus = this.determineHealthStatus(data);
                    // Get battery level and location if available
                    const [batteryLevel, location] = await Promise.all([
                        device.getBatteryLevel(),
                        device.getLocation()
                    ]);
                    status.batteryLevel = batteryLevel;
                    status.location = location;
                    // Emit health data update event
                    this.eventEmitter.emit('healthDataUpdate', {
                        deviceId,
                        data,
                        status
                    });
                }
            });
            return true;
        }
        catch (error) {
            console.error(`Failed to start monitoring device ${deviceId}:`, error);
            this.updateDeviceError(deviceId, 'MONITORING_FAILED', error.message);
            return false;
        }
    }
    async stopMonitoring(deviceId) {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new Error('Device not found');
        }
        try {
            await device.stopRealtimeUpdates();
            return true;
        }
        catch (error) {
            console.error(`Failed to stop monitoring device ${deviceId}:`, error);
            this.updateDeviceError(deviceId, 'STOP_MONITORING_FAILED', error.message);
            return false;
        }
    }
    async checkDeviceStatuses() {
        for (const [deviceId, device] of this.devices) {
            const status = this.deviceStatuses.get(deviceId);
            if (!status)
                continue;
            // Check connection status
            status.isConnected = device.isConnected();
            // Check battery level
            try {
                status.batteryLevel = await device.getBatteryLevel();
                // Emit low battery warning if needed
                if (status.batteryLevel !== null && status.batteryLevel < 20) {
                    this.eventEmitter.emit('lowBattery', {
                        deviceId,
                        batteryLevel: status.batteryLevel
                    });
                }
            }
            catch (error) {
                console.error(`Failed to get battery level for device ${deviceId}:`, error);
            }
            // Check if device needs reconnection
            if (!status.isConnected ||
                (status.lastSyncTime &&
                    Date.now() - status.lastSyncTime.getTime() > 5 * 60 * 1000)) {
                this.eventEmitter.emit('deviceNeedsReconnection', deviceId);
            }
        }
    }
    determineHealthStatus(data) {
        // Implement health status determination logic based on device type and data
        // This is a placeholder implementation
        return 'GOOD';
    }
    updateDeviceError(deviceId, type, message) {
        const status = this.deviceStatuses.get(deviceId);
        if (status) {
            status.errors.push({
                type,
                message,
                timestamp: new Date()
            });
            status.healthStatus = 'ERROR';
            // Emit error event
            this.eventEmitter.emit('deviceError', {
                deviceId,
                error: {
                    type,
                    message
                }
            });
        }
    }
    // Event listeners
    onDeviceRegistered(callback) {
        this.eventEmitter.on('deviceRegistered', callback);
    }
    onDeviceConnected(callback) {
        this.eventEmitter.on('deviceConnected', callback);
    }
    onDeviceDisconnected(callback) {
        this.eventEmitter.on('deviceDisconnected', callback);
    }
    onHealthDataUpdate(callback) {
        this.eventEmitter.on('healthDataUpdate', callback);
    }
    onDeviceError(callback) {
        this.eventEmitter.on('deviceError', callback);
    }
    onLowBattery(callback) {
        this.eventEmitter.on('lowBattery', callback);
    }
    onDeviceNeedsReconnection(callback) {
        this.eventEmitter.on('deviceNeedsReconnection', callback);
    }
}
exports.DeviceManagementService = DeviceManagementService;
