import mongoose, { Schema, Document } from 'mongoose';

export interface IWearableData extends Document {
  userId: mongoose.Types.ObjectId;
  deviceId: string;
  deviceType: string;
  timestamp: Date;
  healthData: {
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
  };
  batteryLevel?: number;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

const WearableDataSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  deviceType: {
    type: String,
    required: true,
    enum: ['SMARTWATCH', 'FITNESS_TRACKER', 'MEDICAL_DEVICE', 'OTHER']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  healthData: {
    heartRate: Number,
    bloodOxygen: Number,
    steps: Number,
    calories: Number,
    distance: Number,
    fallDetected: Boolean,
    activity: {
      type: String,
      enum: ['IDLE', 'WALKING', 'RUNNING', 'SLEEPING', 'OTHER']
    },
    sleepData: {
      startTime: Date,
      endTime: Date,
      quality: {
        type: String,
        enum: ['POOR', 'FAIR', 'GOOD', 'EXCELLENT']
      },
      duration: Number // in minutes
    }
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  location: {
    latitude: Number,
    longitude: Number,
    accuracy: Number
  }
}, {
  timestamps: true
});

// Create compound indexes for efficient querying
WearableDataSchema.index({ userId: 1, timestamp: -1 });
WearableDataSchema.index({ deviceId: 1, timestamp: -1 });
WearableDataSchema.index({ 'healthData.fallDetected': 1, timestamp: -1 });

export default mongoose.model<IWearableData>('WearableData', WearableDataSchema);
