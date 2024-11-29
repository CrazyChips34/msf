import mongoose, { Schema, Document } from 'mongoose';

export interface ILocationHistory extends Document {
  userId: mongoose.Types.ObjectId;
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
  speed?: number;
  altitude?: number;
  journeyId?: string;
  deviceId?: string;
}

const LocationHistorySchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
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
  accuracy: {
    type: Number
  },
  speed: {
    type: Number
  },
  altitude: {
    type: Number
  },
  journeyId: {
    type: String,
    index: true
  },
  deviceId: {
    type: String
  }
}, {
  timestamps: true
});

// Create compound index for efficient querying
LocationHistorySchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model<ILocationHistory>('LocationHistory', LocationHistorySchema);
