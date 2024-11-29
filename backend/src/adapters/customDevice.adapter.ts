import {
  WearableAdapter,
  HealthData,
  DeviceLocation,
  WearableDevice,
  DeviceCredentials
} from '../interfaces/wearable.interface';
import { BleManager, Device, Characteristic } from 'react-native-ble-plx';

export class CustomDeviceAdapter implements WearableAdapter {
  private bleManager: BleManager;
  private device: Device | null = null;
  private isDeviceConnected: boolean = false;
  private deviceInfo: WearableDevice;
  private updateInterval: NodeJS.Timeout | null = null;
  private lastKnownLocation: DeviceLocation | null = null;
  private batteryLevel: number | null = null;
  private deviceConfig: CustomDeviceConfig;

  constructor(config: CustomDeviceConfig) {
    this.bleManager = new BleManager();
    this.deviceConfig = config;
    this.deviceInfo = {
      deviceId: config.deviceId,
      deviceType: config.deviceType,
      manufacturer: config.manufacturer,
      model: config.model
    };
  }

  async connect(credentials: DeviceCredentials): Promise<boolean> {
    try {
      // Scan for the device with the specified ID or name
      const device = await this.scanForDevice();
      if (!device) {
        throw new Error('Device not found');
      }

      // Connect to the device
      await device.connect();
      const connectedDevice = await device.discoverAllServicesAndCharacteristics();
      this.device = connectedDevice;
      this.isDeviceConnected = true;

      // Set up notifications for relevant characteristics
      await this.setupNotifications();

      return true;
    } catch (error) {
      console.error('Failed to connect to device:', error);
      return false;
    }
  }

  private async scanForDevice(): Promise<Device | null> {
    return new Promise((resolve, reject) => {
      this.bleManager.startDeviceScan(
        this.deviceConfig.serviceUUIDs,
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            this.bleManager.stopDeviceScan();
            reject(error);
            return;
          }

          if (device && 
              (device.id === this.deviceConfig.deviceId || 
               device.name === this.deviceConfig.deviceName)) {
            this.bleManager.stopDeviceScan();
            resolve(device);
          }
        }
      );

      // Stop scanning after 10 seconds
      setTimeout(() => {
        this.bleManager.stopDeviceScan();
        resolve(null);
      }, 10000);
    });
  }

  private async setupNotifications(): Promise<void> {
    if (!this.device) return;

    // Set up location notifications if available
    if (this.deviceConfig.characteristics.location) {
      await this.device.monitorCharacteristicForService(
        this.deviceConfig.characteristics.location.serviceUUID,
        this.deviceConfig.characteristics.location.characteristicUUID,
        (error, characteristic) => {
          if (error || !characteristic?.value) return;
          
          const locationData = this.parseLocationData(characteristic);
          if (locationData) {
            this.lastKnownLocation = locationData;
          }
        }
      );
    }

    // Set up battery level notifications
    if (this.deviceConfig.characteristics.battery) {
      await this.device.monitorCharacteristicForService(
        this.deviceConfig.characteristics.battery.serviceUUID,
        this.deviceConfig.characteristics.battery.characteristicUUID,
        (error, characteristic) => {
          if (error || !characteristic?.value) return;
          
          this.batteryLevel = this.parseBatteryLevel(characteristic);
        }
      );
    }

    // Set up vital signs monitoring if available
    if (this.deviceConfig.characteristics.vitals) {
      await this.device.monitorCharacteristicForService(
        this.deviceConfig.characteristics.vitals.serviceUUID,
        this.deviceConfig.characteristics.vitals.characteristicUUID,
        (error, characteristic) => {
          if (error || !characteristic?.value) return;
          
          // Handle vital signs data according to device specification
          this.handleVitalsData(characteristic);
        }
      );
    }
  }

  private parseLocationData(characteristic: Characteristic): DeviceLocation | null {
    try {
      // Decode the characteristic value based on the device's data format
      const buffer = Buffer.from(characteristic.value!, 'base64');
      
      // Example parsing - adjust according to your device's data format
      const latitude = buffer.readFloatLE(0);
      const longitude = buffer.readFloatLE(4);
      const accuracy = buffer.readFloatLE(8);

      return {
        latitude,
        longitude,
        accuracy
      };
    } catch (error) {
      console.error('Error parsing location data:', error);
      return null;
    }
  }

  private parseBatteryLevel(characteristic: Characteristic): number | null {
    try {
      const buffer = Buffer.from(characteristic.value!, 'base64');
      return buffer.readUInt8(0);
    } catch (error) {
      console.error('Error parsing battery level:', error);
      return null;
    }
  }

  private handleVitalsData(characteristic: Characteristic): void {
    try {
      const buffer = Buffer.from(characteristic.value!, 'base64');
      
      // Parse vital signs based on device specification
      // This is an example - adjust according to your device's data format
      if (this.deviceConfig.deviceType === 'ANIMAL_EAR_TRACKER') {
        this.handleAnimalVitals(buffer);
      } else if (this.deviceConfig.deviceType === 'NECKLACE_TRACKER') {
        this.handleNecklaceVitals(buffer);
      }
    } catch (error) {
      console.error('Error handling vitals data:', error);
    }
  }

  private handleAnimalVitals(buffer: Buffer): void {
    // Example parsing for animal vital signs
    // Adjust based on actual device specifications
    const temperature = buffer.readFloatLE(0);
    const heartRate = buffer.readUInt16LE(4);
    const activity = buffer.readUInt8(6);

    // Store the data for health updates
    this.lastHealthData = {
      heartRate,
      temperature,
      activity: this.mapActivityLevel(activity)
    };
  }

  private handleNecklaceVitals(buffer: Buffer): void {
    // Example parsing for necklace vital signs
    // Adjust based on actual device specifications
    const heartRate = buffer.readUInt16LE(0);
    const fallDetected = buffer.readUInt8(2) === 1;
    const steps = buffer.readUInt32LE(3);

    // Store the data for health updates
    this.lastHealthData = {
      heartRate,
      fallDetected,
      steps
    };
  }

  private mapActivityLevel(level: number): string {
    const activityLevels = ['RESTING', 'ACTIVE', 'VERY_ACTIVE', 'RUNNING'];
    return activityLevels[level] || 'UNKNOWN';
  }

  async disconnect(): Promise<boolean> {
    try {
      if (this.device) {
        await this.device.cancelConnection();
      }
      await this.stopRealtimeUpdates();
      this.isDeviceConnected = false;
      return true;
    } catch (error) {
      console.error('Failed to disconnect from device:', error);
      return false;
    }
  }

  async getHealthData(): Promise<HealthData> {
    if (!this.isDeviceConnected) {
      throw new Error('Device not connected');
    }

    // Return the last known health data
    // This will be different based on device type
    return this.lastHealthData || {};
  }

  async getLocation(): Promise<DeviceLocation | null> {
    return this.lastKnownLocation;
  }

  async getBatteryLevel(): Promise<number | null> {
    return this.batteryLevel;
  }

  async startRealtimeUpdates(callback: (data: HealthData) => void): Promise<void> {
    if (!this.isDeviceConnected) {
      throw new Error('Device not connected');
    }

    // Set up polling interval for data updates
    this.updateInterval = setInterval(async () => {
      try {
        const healthData = await this.getHealthData();
        callback(healthData);
      } catch (error) {
        console.error('Error in real-time updates:', error);
      }
    }, this.deviceConfig.updateInterval || 60000);
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

interface CustomDeviceConfig {
  deviceId: string;
  deviceName?: string;
  deviceType: string;
  manufacturer: string;
  model?: string;
  serviceUUIDs?: string[];
  updateInterval?: number;
  characteristics: {
    location?: {
      serviceUUID: string;
      characteristicUUID: string;
    };
    battery?: {
      serviceUUID: string;
      characteristicUUID: string;
    };
    vitals?: {
      serviceUUID: string;
      characteristicUUID: string;
    };
  };
}
