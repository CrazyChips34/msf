"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleFitAdapter = void 0;
const react_native_google_fit_1 = __importStar(require("react-native-google-fit"));
class GoogleFitAdapter {
    constructor() {
        this.isDeviceConnected = false;
        this.updateInterval = null;
        this.deviceInfo = {
            deviceId: 'google-fit',
            deviceType: 'GOOGLE_FIT',
            manufacturer: 'Google',
        };
    }
    async initializeGoogleFit(credentials) {
        const options = {
            scopes: [
                react_native_google_fit_1.Scopes.FITNESS_ACTIVITY_READ,
                react_native_google_fit_1.Scopes.FITNESS_BODY_READ,
                react_native_google_fit_1.Scopes.FITNESS_HEART_RATE_READ,
                react_native_google_fit_1.Scopes.FITNESS_LOCATION_READ,
            ],
        };
        try {
            await react_native_google_fit_1.default.authorize(options);
            await react_native_google_fit_1.default.checkIsAuthorized();
        }
        catch (error) {
            throw new Error(`GoogleFit initialization failed: ${error.message}`);
        }
    }
    async connect(credentials) {
        try {
            await this.initializeGoogleFit(credentials);
            this.isDeviceConnected = true;
            return true;
        }
        catch (error) {
            console.error('Failed to connect to GoogleFit:', error);
            return false;
        }
    }
    async disconnect() {
        try {
            await this.stopRealtimeUpdates();
            await react_native_google_fit_1.default.disconnect();
            this.isDeviceConnected = false;
            return true;
        }
        catch (error) {
            console.error('Failed to disconnect from GoogleFit:', error);
            return false;
        }
    }
    async getHealthData() {
        if (!this.isDeviceConnected) {
            throw new Error('GoogleFit not connected');
        }
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        const endDate = new Date();
        try {
            const [heartRate, steps, calories, distance, sleepData] = await Promise.all([
                this.getLatestHeartRate(startDate, endDate),
                this.getDailySteps(),
                this.getDailyCalories(startDate, endDate),
                this.getDailyDistance(startDate, endDate),
                this.getSleepData(startDate, endDate)
            ]);
            return {
                heartRate,
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
    async getLatestHeartRate(startDate, endDate) {
        const heartRateData = await react_native_google_fit_1.default.getHeartRateSamples({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });
        return heartRateData.length > 0 ? heartRateData[heartRateData.length - 1].value : undefined;
    }
    async getDailySteps() {
        const stepsData = await react_native_google_fit_1.default.getDailySteps();
        return stepsData.length > 0 ? stepsData[0].steps[0].value : undefined;
    }
    async getDailyCalories(startDate, endDate) {
        const caloriesData = await react_native_google_fit_1.default.getDailyCalorieSamples({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });
        return caloriesData.length > 0 ? caloriesData[0].calorie : undefined;
    }
    async getDailyDistance(startDate, endDate) {
        const distanceData = await react_native_google_fit_1.default.getDailyDistanceSamples({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });
        return distanceData.length > 0 ? distanceData[0].distance : undefined;
    }
    async getSleepData(startDate, endDate) {
        const sleepData = await react_native_google_fit_1.default.getSleepSamples({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });
        if (sleepData.length === 0) {
            return undefined;
        }
        const lastSleep = sleepData[sleepData.length - 1];
        return {
            startTime: new Date(lastSleep.startDate),
            endTime: new Date(lastSleep.endDate),
            duration: (new Date(lastSleep.endDate).getTime() - new Date(lastSleep.startDate).getTime()) / (1000 * 60),
            quality: this.mapSleepQuality(lastSleep.sleepState)
        };
    }
    mapSleepQuality(sleepState) {
        // Google Fit sleep states mapping
        switch (sleepState) {
            case 1: return 'POOR'; // Awake (during sleep)
            case 2: return 'FAIR'; // Sleep
            case 3: return 'GOOD'; // Out-of-bed
            case 4: return 'GOOD'; // Light sleep
            case 5: return 'EXCELLENT'; // Deep sleep
            case 6: return 'EXCELLENT'; // REM
            default: return 'FAIR';
        }
    }
    async getLocation() {
        if (!this.isDeviceConnected) {
            return null;
        }
        try {
            const locations = await react_native_google_fit_1.default.getLocationSamples({
                startDate: new Date().toISOString(),
                endDate: new Date().toISOString(),
            });
            if (locations.length > 0) {
                const lastLocation = locations[locations.length - 1];
                return {
                    latitude: lastLocation.latitude,
                    longitude: lastLocation.longitude,
                    accuracy: lastLocation.accuracy
                };
            }
            return null;
        }
        catch (error) {
            console.error('Failed to get location:', error);
            return null;
        }
    }
    async getBatteryLevel() {
        // Google Fit API doesn't provide battery level information
        return null;
    }
    async startRealtimeUpdates(callback) {
        if (!this.isDeviceConnected) {
            throw new Error('GoogleFit not connected');
        }
        // Google Fit doesn't have real-time updates, so we'll poll every minute
        this.updateInterval = setInterval(async () => {
            try {
                const healthData = await this.getHealthData();
                callback(healthData);
            }
            catch (error) {
                console.error('Error in real-time updates:', error);
            }
        }, 60000); // Poll every minute
    }
    async stopRealtimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    isConnected() {
        return this.isDeviceConnected;
    }
    getDeviceInfo() {
        return this.deviceInfo;
    }
}
exports.GoogleFitAdapter = GoogleFitAdapter;
