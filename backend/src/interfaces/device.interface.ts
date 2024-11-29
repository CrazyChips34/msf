import { DeviceLocation } from './wearable.interface';

export enum DeviceType {
  APPLE_HEALTH = 'APPLE_HEALTH',
  GOOGLE_FIT = 'GOOGLE_FIT',
  ANIMAL_EAR_TRACKER = 'ANIMAL_EAR_TRACKER',
  NECKLACE_TRACKER = 'NECKLACE_TRACKER',
  CUSTOM = 'CUSTOM'
}

export interface DeviceConfig {
  deviceId: string;
  deviceName?: string;
  deviceType: DeviceType;
  manufacturer: string;
  model?: string;
  serviceUUIDs?: string[];
  updateInterval?: number;
  characteristics?: {
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
  thresholds?: {
    heartRate?: {
      min: number;
      max: number;
    };
    temperature?: {
      min: number;
      max: number;
    };
    batteryLevel?: number;
    inactivityPeriod?: number;
  };
  alerts?: {
    lowBattery?: boolean;
    disconnection?: boolean;
    healthWarnings?: boolean;
    inactivity?: boolean;
    geofence?: boolean;
  };
}

export interface DeviceError {
  type: string;
  message: string;
  timestamp: Date;
}

export interface DeviceStatus {
  deviceId: string;
  isConnected: boolean;
  batteryLevel: number | null;
  lastSyncTime: Date | null;
  location?: DeviceLocation;
  errors: DeviceError[];
  healthStatus: 'GOOD' | 'WARNING' | 'ERROR' | 'UNKNOWN';
}

export interface HealthAlert {
  deviceId: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  timestamp: Date;
  data: any;
}
