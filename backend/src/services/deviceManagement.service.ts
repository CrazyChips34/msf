import { WearableAdapter } from '../interfaces/wearable.interface';
import { AppleHealthKitAdapter } from '../adapters/appleHealthKit.adapter';
import { GoogleFitAdapter } from '../adapters/googleFit.adapter';
import { CustomDeviceAdapter } from '../adapters/customDevice.adapter';
import { DeviceConfig, DeviceStatus, DeviceType } from '../interfaces/device.interface';
import { EventEmitter } from 'events';

export class DeviceManagementService {
  private devices: Map<string, WearableAdapter> = new Map();
  private deviceConfigs: Map<string, DeviceConfig> = new Map();
  private deviceStatuses: Map<string, DeviceStatus> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();

  constructor() {
    // Set up periodic device status checks
    setInterval(() => this.checkDeviceStatuses(), 60000);
  }

  async registerDevice(config: DeviceConfig): Promise<boolean> {
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
    } catch (error) {
      console.error('Failed to register device:', error);
      return false;
    }
  }

  private createDeviceAdapter(config: DeviceConfig): WearableAdapter | null {
    switch (config.deviceType) {
      case DeviceType.APPLE_HEALTH:
        return new AppleHealthKitAdapter();
      case DeviceType.GOOGLE_FIT:
        return new GoogleFitAdapter();
      case DeviceType.ANIMAL_EAR_TRACKER:
      case DeviceType.NECKLACE_TRACKER:
      case DeviceType.CUSTOM:
        return new CustomDeviceAdapter(config);
      default:
        return null;
    }
  }

  async connectDevice(deviceId: string, credentials?: any): Promise<boolean> {
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
    } catch (error) {
      console.error(`Failed to connect device ${deviceId}:`, error);
      this.updateDeviceError(deviceId, 'CONNECTION_FAILED', error.message);
      return false;
    }
  }

  async disconnectDevice(deviceId: string): Promise<boolean> {
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
    } catch (error) {
      console.error(`Failed to disconnect device ${deviceId}:`, error);
      this.updateDeviceError(deviceId, 'DISCONNECT_FAILED', error.message);
      return false;
    }
  }

  async getDeviceStatus(deviceId: string): Promise<DeviceStatus | null> {
    return this.deviceStatuses.get(deviceId) || null;
  }

  async getAllDevices(): Promise<DeviceConfig[]> {
    return Array.from(this.deviceConfigs.values());
  }

  async getConnectedDevices(): Promise<DeviceConfig[]> {
    return Array.from(this.deviceConfigs.values()).filter(config => 
      this.deviceStatuses.get(config.deviceId)?.isConnected
    );
  }

  async startMonitoring(deviceId: string): Promise<boolean> {
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
    } catch (error) {
      console.error(`Failed to start monitoring device ${deviceId}:`, error);
      this.updateDeviceError(deviceId, 'MONITORING_FAILED', error.message);
      return false;
    }
  }

  async stopMonitoring(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    try {
      await device.stopRealtimeUpdates();
      return true;
    } catch (error) {
      console.error(`Failed to stop monitoring device ${deviceId}:`, error);
      this.updateDeviceError(deviceId, 'STOP_MONITORING_FAILED', error.message);
      return false;
    }
  }

  private async checkDeviceStatuses(): Promise<void> {
    for (const [deviceId, device] of this.devices) {
      const status = this.deviceStatuses.get(deviceId);
      if (!status) continue;

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
      } catch (error) {
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

  private determineHealthStatus(data: any): string {
    // Implement health status determination logic based on device type and data
    // This is a placeholder implementation
    return 'GOOD';
  }

  private updateDeviceError(deviceId: string, type: string, message: string): void {
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
  onDeviceRegistered(callback: (config: DeviceConfig) => void): void {
    this.eventEmitter.on('deviceRegistered', callback);
  }

  onDeviceConnected(callback: (deviceId: string) => void): void {
    this.eventEmitter.on('deviceConnected', callback);
  }

  onDeviceDisconnected(callback: (deviceId: string) => void): void {
    this.eventEmitter.on('deviceDisconnected', callback);
  }

  onHealthDataUpdate(callback: (update: any) => void): void {
    this.eventEmitter.on('healthDataUpdate', callback);
  }

  onDeviceError(callback: (error: any) => void): void {
    this.eventEmitter.on('deviceError', callback);
  }

  onLowBattery(callback: (data: any) => void): void {
    this.eventEmitter.on('lowBattery', callback);
  }

  onDeviceNeedsReconnection(callback: (deviceId: string) => void): void {
    this.eventEmitter.on('deviceNeedsReconnection', callback);
  }
}
