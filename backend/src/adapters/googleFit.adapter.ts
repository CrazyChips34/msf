import {
  WearableAdapter,
  HealthData,
  DeviceLocation,
  WearableDevice,
  DeviceCredentials
} from '../interfaces/wearable.interface';
import GoogleFit, { Scopes } from 'react-native-google-fit';

export class GoogleFitAdapter implements WearableAdapter {
  private isDeviceConnected: boolean = false;
  private deviceInfo: WearableDevice;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.deviceInfo = {
      deviceId: 'google-fit',
      deviceType: 'GOOGLE_FIT',
      manufacturer: 'Google',
    };
  }

  private async initializeGoogleFit(credentials: DeviceCredentials): Promise<void> {
    const options = {
      scopes: [
        Scopes.FITNESS_ACTIVITY_READ,
        Scopes.FITNESS_BODY_READ,
        Scopes.FITNESS_HEART_RATE_READ,
        Scopes.FITNESS_LOCATION_READ,
      ],
    };

    try {
      await GoogleFit.authorize(options);
      await GoogleFit.checkIsAuthorized();
    } catch (error) {
      throw new Error(`GoogleFit initialization failed: ${error.message}`);
    }
  }

  async connect(credentials: DeviceCredentials): Promise<boolean> {
    try {
      await this.initializeGoogleFit(credentials);
      this.isDeviceConnected = true;
      return true;
    } catch (error) {
      console.error('Failed to connect to GoogleFit:', error);
      return false;
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      await this.stopRealtimeUpdates();
      await GoogleFit.disconnect();
      this.isDeviceConnected = false;
      return true;
    } catch (error) {
      console.error('Failed to disconnect from GoogleFit:', error);
      return false;
    }
  }

  async getHealthData(): Promise<HealthData> {
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
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      throw error;
    }
  }

  private async getLatestHeartRate(startDate: Date, endDate: Date): Promise<number | undefined> {
    const heartRateData = await GoogleFit.getHeartRateSamples({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return heartRateData.length > 0 ? heartRateData[heartRateData.length - 1].value : undefined;
  }

  private async getDailySteps(): Promise<number | undefined> {
    const stepsData = await GoogleFit.getDailySteps();
    return stepsData.length > 0 ? stepsData[0].steps[0].value : undefined;
  }

  private async getDailyCalories(startDate: Date, endDate: Date): Promise<number | undefined> {
    const caloriesData = await GoogleFit.getDailyCalorieSamples({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return caloriesData.length > 0 ? caloriesData[0].calorie : undefined;
  }

  private async getDailyDistance(startDate: Date, endDate: Date): Promise<number | undefined> {
    const distanceData = await GoogleFit.getDailyDistanceSamples({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return distanceData.length > 0 ? distanceData[0].distance : undefined;
  }

  private async getSleepData(startDate: Date, endDate: Date): Promise<HealthData['sleepData']> {
    const sleepData = await GoogleFit.getSleepSamples({
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

  private mapSleepQuality(sleepState: number): string {
    // Google Fit sleep states mapping
    switch (sleepState) {
      case 1: return 'POOR';     // Awake (during sleep)
      case 2: return 'FAIR';     // Sleep
      case 3: return 'GOOD';     // Out-of-bed
      case 4: return 'GOOD';     // Light sleep
      case 5: return 'EXCELLENT';// Deep sleep
      case 6: return 'EXCELLENT';// REM
      default: return 'FAIR';
    }
  }

  async getLocation(): Promise<DeviceLocation | null> {
    if (!this.isDeviceConnected) {
      return null;
    }

    try {
      const locations = await GoogleFit.getLocationSamples({
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
    } catch (error) {
      console.error('Failed to get location:', error);
      return null;
    }
  }

  async getBatteryLevel(): Promise<number | null> {
    // Google Fit API doesn't provide battery level information
    return null;
  }

  async startRealtimeUpdates(callback: (data: HealthData) => void): Promise<void> {
    if (!this.isDeviceConnected) {
      throw new Error('GoogleFit not connected');
    }

    // Google Fit doesn't have real-time updates, so we'll poll every minute
    this.updateInterval = setInterval(async () => {
      try {
        const healthData = await this.getHealthData();
        callback(healthData);
      } catch (error) {
        console.error('Error in real-time updates:', error);
      }
    }, 60000); // Poll every minute
  }

  async stopRealtimeUpdates(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  isConnected(): boolean {
    return this.isDeviceConnected;
  }

  getDeviceInfo(): WearableDevice {
    return this.deviceInfo;
  }
}
