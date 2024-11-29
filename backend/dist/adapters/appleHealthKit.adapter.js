"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleHealthKitAdapter = void 0;
const react_native_health_1 = __importDefault(require("react-native-health"));
class AppleHealthKitAdapter {
    constructor() {
        this.isDeviceConnected = false;
        this.observers = [];
        this.deviceInfo = {
            deviceId: 'apple-healthkit',
            deviceType: 'HEALTHKIT',
            manufacturer: 'Apple',
        };
    }
    async initializeHealthKit() {
        const permissions = {
            permissions: {
                read: [
                    react_native_health_1.default.Constants.Permissions.HeartRate,
                    react_native_health_1.default.Constants.Permissions.BloodOxygen,
                    react_native_health_1.default.Constants.Permissions.Steps,
                    react_native_health_1.default.Constants.Permissions.Calories,
                    react_native_health_1.default.Constants.Permissions.Distance,
                    react_native_health_1.default.Constants.Permissions.Sleep,
                    react_native_health_1.default.Constants.Permissions.Activity
                ],
                write: []
            }
        };
        try {
            await react_native_health_1.default.initHealthKit(permissions);
        }
        catch (error) {
            throw new Error(`HealthKit initialization failed: ${error.message}`);
        }
    }
    async connect(credentials) {
        try {
            await this.initializeHealthKit();
            this.isDeviceConnected = true;
            return true;
        }
        catch (error) {
            console.error('Failed to connect to HealthKit:', error);
            return false;
        }
    }
    async disconnect() {
        try {
            await this.stopRealtimeUpdates();
            this.isDeviceConnected = false;
            return true;
        }
        catch (error) {
            console.error('Failed to disconnect from HealthKit:', error);
            return false;
        }
    }
    async getHealthData() {
        if (!this.isDeviceConnected) {
            throw new Error('HealthKit not connected');
        }
        const options = {
            startDate: new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString(), // last 24 hours
            endDate: new Date().toISOString(),
        };
        try {
            const [heartRate, bloodOxygen, steps, calories, distance, sleepData] = await Promise.all([
                this.getLatestHeartRate(options),
                this.getLatestBloodOxygen(options),
                this.getDailySteps(options),
                this.getDailyCalories(options),
                this.getDailyDistance(options),
                this.getSleepData(options)
            ]);
            return {
                heartRate,
                bloodOxygen,
                steps,
                calories,
                distance,
                sleepData
            };
        }
        catch (error) {
            console.error('Failed to fetch health data:', error);
            throw error;
        }
    }
    async getLatestHeartRate(options) {
        return new Promise((resolve, reject) => {
            react_native_health_1.default.getHeartRateSamples(options, (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results.length > 0 ? results[results.length - 1].value : undefined);
            });
        });
    }
    async getLatestBloodOxygen(options) {
        return new Promise((resolve, reject) => {
            react_native_health_1.default.getOxygenSaturationSamples(options, (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results.length > 0 ? results[results.length - 1].value : undefined);
            });
        });
    }
    async getDailySteps(options) {
        return new Promise((resolve, reject) => {
            react_native_health_1.default.getDailyStepCountSamples(options, (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results.length > 0 ? results[0].value : undefined);
            });
        });
    }
    async getDailyCalories(options) {
        return new Promise((resolve, reject) => {
            react_native_health_1.default.getDailyCaloriesSamples(options, (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results.length > 0 ? results[0].value : undefined);
            });
        });
    }
    async getDailyDistance(options) {
        return new Promise((resolve, reject) => {
            react_native_health_1.default.getDailyDistanceWalkingRunningSamples(options, (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results.length > 0 ? results[0].value : undefined);
            });
        });
    }
    async getSleepData(options) {
        return new Promise((resolve, reject) => {
            react_native_health_1.default.getSleepSamples(options, (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (results.length === 0) {
                    resolve(undefined);
                    return;
                }
                const lastSleep = results[results.length - 1];
                resolve({
                    startTime: new Date(lastSleep.startDate),
                    endTime: new Date(lastSleep.endDate),
                    duration: (new Date(lastSleep.endDate).getTime() - new Date(lastSleep.startDate).getTime()) / (1000 * 60), // duration in minutes
                    quality: 'GOOD' // Apple HealthKit doesn't provide sleep quality data
                });
            });
        });
    }
    async getLocation() {
        // Apple HealthKit doesn't provide location data
        return null;
    }
    async getBatteryLevel() {
        // Apple HealthKit doesn't provide battery level
        return null;
    }
    async startRealtimeUpdates(callback) {
        if (!this.isDeviceConnected) {
            throw new Error('HealthKit not connected');
        }
        // Set up observers for real-time updates
        const heartRateObserver = react_native_health_1.default.observeHeartRate({}, async (error, results) => {
            if (error) {
                console.error('Heart rate observer error:', error);
                return;
            }
            const healthData = await this.getHealthData();
            callback(healthData);
        });
        this.observers.push(heartRateObserver);
    }
    async stopRealtimeUpdates() {
        // Clean up all observers
        this.observers.forEach(observer => observer.stop());
        this.observers = [];
    }
    isConnected() {
        return this.isDeviceConnected;
    }
    getDeviceInfo() {
        return this.deviceInfo;
    }
}
exports.AppleHealthKitAdapter = AppleHealthKitAdapter;
