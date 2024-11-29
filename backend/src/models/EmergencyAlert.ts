import mongoose, { Schema, Document } from 'mongoose';

export interface IEmergencyAlert extends Document {
  userId: mongoose.Types.ObjectId;
  alertType: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  status: string;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  deviceId?: string;
  healthData?: {
    heartRate?: number;
    fallDetected?: boolean;
    [key: string]: any;
  };
  description?: string;
}

const EmergencyAlertSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  alertType: {
    type: String,
    required: true,
    enum: ['SOS', 'FALL_DETECTED', 'HEALTH_ALERT', 'JOURNEY_ALERT', 'GEOFENCE_BREACH'],
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'],
    default: 'ACTIVE'
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  deviceId: {
    type: String
  },
  healthData: {
    heartRate: Number,
    fallDetected: Boolean
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

// Create compound indexes for efficient querying
EmergencyAlertSchema.index({ userId: 1, timestamp: -1 });
EmergencyAlertSchema.index({ status: 1, timestamp: -1 });

export default mongoose.model<IEmergencyAlert>('EmergencyAlert', EmergencyAlertSchema);
