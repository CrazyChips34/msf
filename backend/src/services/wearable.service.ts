import { EmergencyAlert } from '../models/EmergencyAlert';
import { WearableData } from '../models/WearableData';
import { User } from '../models/User';

interface HealthDataThresholds {
  minHeartRate: number;
  maxHeartRate: number;
  minBloodOxygen: number;
}

export class WearableService {
  private static readonly DEFAULT_THRESHOLDS: HealthDataThresholds = {
    minHeartRate: 40,
    maxHeartRate: 150,
    minBloodOxygen: 90
  };

  static async processHealthData(
    userId: string,
    deviceId: string,
    healthData: any
  ): Promise<{ alert: boolean; type?: string; message?: string }> {
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
    } catch (error) {
      console.error('Error processing health data:', error);
      throw error;
    }
  }

  private static async checkVitalSigns(
    userId: string,
    healthData: any
  ): Promise<{ alert: boolean; type?: string; message?: string }> {
    const thresholds = await this.getUserThresholds(userId);

    if (
      healthData.heartRate &&
      (healthData.heartRate < thresholds.minHeartRate ||
        healthData.heartRate > thresholds.maxHeartRate)
    ) {
      return {
        alert: true,
        type: 'HEALTH_ALERT',
        message: `Abnormal heart rate detected: ${healthData.heartRate} BPM`
      };
    }

    if (
      healthData.bloodOxygen &&
      healthData.bloodOxygen < thresholds.minBloodOxygen
    ) {
      return {
        alert: true,
        type: 'HEALTH_ALERT',
        message: `Low blood oxygen level detected: ${healthData.bloodOxygen}%`
      };
    }

    return { alert: false };
  }

  private static async getUserThresholds(userId: string): Promise<HealthDataThresholds> {
    try {
      const user = await User.findById(userId);
      // In the future, we could store user-specific thresholds
      return this.DEFAULT_THRESHOLDS;
    } catch (error) {
      console.error('Error getting user thresholds:', error);
      return this.DEFAULT_THRESHOLDS;
    }
  }

  private static async createFallAlert(
    userId: string,
    deviceId: string,
    healthData: any
  ): Promise<void> {
    const alert = new EmergencyAlert({
      userId,
      alertType: 'FALL_DETECTED',
      status: 'ACTIVE',
      deviceId,
      healthData: {
        fallDetected: true,
        heartRate: healthData.heartRate
      },
      latitude: healthData.location?.latitude,
      longitude: healthData.location?.longitude,
      description: 'Fall detected by wearable device'
    });

    await alert.save();
  }

  private static async createHealthAlert(
    userId: string,
    deviceId: string,
    healthData: any,
    description: string
  ): Promise<void> {
    const alert = new EmergencyAlert({
      userId,
      alertType: 'HEALTH_ALERT',
      status: 'ACTIVE',
      deviceId,
      healthData: {
        heartRate: healthData.heartRate,
        bloodOxygen: healthData.bloodOxygen
      },
      latitude: healthData.location?.latitude,
      longitude: healthData.location?.longitude,
      description
    });

    await alert.save();
  }

  static async getDeviceStats(deviceId: string, userId: string) {
    try {
      const stats = await WearableData.aggregate([
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
    } catch (error) {
      console.error('Error getting device stats:', error);
      throw error;
    }
  }
}

export default WearableService;
