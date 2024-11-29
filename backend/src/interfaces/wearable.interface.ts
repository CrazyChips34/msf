export interface HealthData {
  heartRate?: number;
  bloodOxygen?: number;
  steps?: number;
  calories?: number;
  distance?: number;
  fallDetected?: boolean;
  activity?: string;
  sleepData?: {
    startTime?: Date;
    endTime?: Date;
    quality?: string;
    duration?: number;
  };
}

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface WearableDevice {
  deviceId: string;
  deviceType: string;
  manufacturer: string;
  model?: string;
  batteryLevel?: number;
}

export interface DeviceCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string[];
}

export interface WearableAdapter {
  connect(credentials: DeviceCredentials): Promise<boolean>;
  disconnect(): Promise<boolean>;
  getHealthData(): Promise<HealthData>;
  getLocation(): Promise<DeviceLocation | null>;
  getBatteryLevel(): Promise<number | null>;
  startRealtimeUpdates(callback: (data: HealthData) => void): Promise<void>;
  stopRealtimeUpdates(): Promise<void>;
  isConnected(): boolean;
  getDeviceInfo(): WearableDevice;
}
