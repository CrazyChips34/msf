"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WearableService = void 0;
const EmergencyAlert_1 = require("../models/EmergencyAlert");
const WearableData_1 = require("../models/WearableData");
const User_1 = require("../models/User");
class WearableService {
    static async processHealthData(userId, deviceId, healthData) {
        try {
            // Check for fall detection
            if (healthData.fallDetected) {
                await this.createFallAlert(userId, deviceId, healthData);
                return {
                    alert: true,
                    type: 'FALL_DETECTED',
                    message: 'Fall detected! Emergency contacts will be notified.'
                };
            }
            // Check vital signs
            const vitalSignAlert = await this.checkVitalSigns(userId, healthData);
            if (vitalSignAlert.alert) {
                await this.createHealthAlert(userId, deviceId, healthData, vitalSignAlert.message);
                return vitalSignAlert;
            }
            return { alert: false };
        }
        catch (error) {
            console.error('Error processing health data:', error);
            throw error;
        }
    }
    static async checkVitalSigns(userId, healthData) {
        const thresholds = await this.getUserThresholds(userId);
        if (healthData.heartRate &&
            (healthData.heartRate < thresholds.minHeartRate ||
                healthData.heartRate > thresholds.maxHeartRate)) {
            return {
                alert: true,
                type: 'HEALTH_ALERT',
                message: `Abnormal heart rate detected: ${healthData.heartRate} BPM`
            };
        }
        if (healthData.bloodOxygen &&
            healthData.bloodOxygen < thresholds.minBloodOxygen) {
            return {
                alert: true,
                type: 'HEALTH_ALERT',
                message: `Low blood oxygen level detected: ${healthData.bloodOxygen}%`
            };
        }
        return { alert: false };
    }
    static async getUserThresholds(userId) {
        try {
            const user = await User_1.User.findById(userId);
            // In the future, we could store user-specific thresholds
            return this.DEFAULT_THRESHOLDS;
        }
        catch (error) {
            console.error('Error getting user thresholds:', error);
            return this.DEFAULT_THRESHOLDS;
        }
    }
    static async createFallAlert(userId, deviceId, healthData) {
        var _a, _b;
        const alert = new EmergencyAlert_1.EmergencyAlert({
            userId,
            alertType: 'FALL_DETECTED',
            status: 'ACTIVE',
            deviceId,
            healthData: {
                fallDetected: true,
                heartRate: healthData.heartRate
            },
            latitude: (_a = healthData.location) === null || _a === void 0 ? void 0 : _a.latitude,
            longitude: (_b = healthData.location) === null || _b === void 0 ? void 0 : _b.longitude,
            description: 'Fall detected by wearable device'
        });
        await alert.save();
    }
    static async createHealthAlert(userId, deviceId, healthData, description) {
        var _a, _b;
        const alert = new EmergencyAlert_1.EmergencyAlert({
            userId,
            alertType: 'HEALTH_ALERT',
            status: 'ACTIVE',
            deviceId,
            healthData: {
                heartRate: healthData.heartRate,
                bloodOxygen: healthData.bloodOxygen
            },
            latitude: (_a = healthData.location) === null || _a === void 0 ? void 0 : _a.latitude,
            longitude: (_b = healthData.location) === null || _b === void 0 ? void 0 : _b.longitude,
            description
        });
        await alert.save();
    }
    static async getDeviceStats(deviceId, userId) {
        try {
            const stats = await WearableData_1.WearableData.aggregate([
                {
                    $match: {
                        deviceId,
                        userId: new mongoose.Types.ObjectId(userId),
                        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgHeartRate: { $avg: '$healthData.heartRate' },
                        avgBloodOxygen: { $avg: '$healthData.bloodOxygen' },
                        totalSteps: { $sum: '$healthData.steps' },
                        totalCalories: { $sum: '$healthData.calories' },
                        totalDistance: { $sum: '$healthData.distance' },
                        lastBatteryLevel: { $last: '$batteryLevel' }
                    }
                }
            ]);
            return stats[0] || null;
        }
        catch (error) {
            console.error('Error getting device stats:', error);
            throw error;
        }
    }
}
exports.WearableService = WearableService;
WearableService.DEFAULT_THRESHOLDS = {
    minHeartRate: 40,
    maxHeartRate: 150,
    minBloodOxygen: 90
};
exports.default = WearableService;
