import {
  WearableAdapter,
  HealthData,
  DeviceLocation,
  WearableDevice,
  DeviceCredentials
} from '../interfaces/wearable.interface';
import AppleHealthKit, {
  HealthKitPermissions,
  HealthInputOptions,
  HealthObserver
} from 'react-native-health';

export class AppleHealthKitAdapter implements WearableAdapter {
  private isDeviceConnected: boolean = false;
  private deviceInfo: WearableDevice;
  private observers: HealthObserver[] = [];

  constructor() {
    this.deviceInfo = {
      deviceId: 'apple-healthkit',
      deviceType: 'HEALTHKIT',
      manufacturer: 'Apple',
    };
  }

  private async initializeHealthKit(): Promise<void> {
    const permissions = {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.HeartRate,
          AppleHealthKit.Constants.Permissions.BloodOxygen,
          AppleHealthKit.Constants.Permissions.Steps,
          AppleHealthKit.Constants.Permissions.Calories,
          AppleHealthKit.Constants.Permissions.Distance,
          AppleHealthKit.Constants.Permissions.Sleep,
          AppleHealthKit.Constants.Permissions.Activity
        ],
        write: []
      }
    } as HealthKitPermissions;

    try {
      await AppleHealthKit.initHealthKit(permissions);
    } catch (error) {
      throw new Error(`HealthKit initialization failed: ${error.message}`);
    }
  }

  async connect(credentials: DeviceCredentials): Promise<boolean> {
    try {
      await this.initializeHealthKit();
      this.isDeviceConnected = true;
      return true;
    } catch (error) {
      console.error('Failed to connect to HealthKit:', error);
      return false;
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      await this.stopRealtimeUpdates();
      this.isDeviceConnected = false;
      return true;
    } catch (error) {
      console.error('Failed to disconnect from HealthKit:', error);
      return false;
    }
  }

  async getHealthData(): Promise<HealthData> {
    if (!this.isDeviceConnected) {
      throw new Error('HealthKit not connected');
    }

    const options: HealthInputOptions = {
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
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      throw error;
    }
  }

  private async getLatestHeartRate(options: HealthInputOptions): Promise<number | undefined> {
    return new Promise((resolve, reject) => {
      AppleHealthKit.getHeartRateSamples(options, (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results.length > 0 ? results[results.length - 1].value : undefined);
      });
    });
  }

  private async getLatestBloodOxygen(options: HealthInputOptions): Promise<number | undefined> {
    return new Promise((resolve, reject) => {
      AppleHealthKit.getOxygenSaturationSamples(options, (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results.length > 0 ? results[results.length - 1].value : undefined);
      });
    });
  }

  private async getDailySteps(options: HealthInputOptions): Promise<number | undefined> {
    return new Promise((resolve, reject) => {
      AppleHealthKit.getDailyStepCountSamples(options, (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results.length > 0 ? results[0].value : undefined);
      });
    });
  }

  private async getDailyCalories(options: HealthInputOptions): Promise<number | undefined> {
    return new Promise((resolve, reject) => {
      AppleHealthKit.getDailyCaloriesSamples(options, (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results.length > 0 ? results[0].value : undefined);
      });
    });
  }

  private async getDailyDistance(options: HealthInputOptions): Promise<number | undefined> {
    return new Promise((resolve, reject) => {
      AppleHealthKit.getDailyDistanceWalkingRunningSamples(options, (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results.length > 0 ? results[0].value : undefined);
      });
    });
  }

  private async getSleepData(options: HealthInputOptions): Promise<HealthData['sleepData']> {
    return new Promise((resolve, reject) => {
      AppleHealthKit.getSleepSamples(options, (error, results) => {
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

  async getLocation(): Promise<DeviceLocation | null> {
    // Apple HealthKit doesn't provide location data
    return null;
  }

  async getBatteryLevel(): Promise<number | null> {
    // Apple HealthKit doesn't provide battery level
    return null;
  }

  async startRealtimeUpdates(callback: (data: HealthData) => void): Promise<void> {
    if (!this.isDeviceConnected) {
      throw new Error('HealthKit not connected');
    }

    // Set up observers for real-time updates
    const heartRateObserver = AppleHealthKit.observeHeartRate({}, async (error, results) => {
      if (error) {
        console.error('Heart rate observer error:', error);
        return;
      }
      const healthData = await this.getHealthData();
      callback(healthData);
    });

    this.observers.push(heartRateObserver);
  }

  async stopRealtimeUpdates(): Promise<void> {
    // Clean up all observers
    this.observers.forEach(observer => observer.stop());
    this.observers = [];
  }

  isConnected(): boolean {
    return this.isDeviceConnected;
  }

  getDeviceInfo(): WearableDevice {
    return this.deviceInfo;
  }
}
