import mongoose, { Schema, Document } from 'mongoose';

export enum DeviceType {
  WEARABLE = 'WEARABLE',
  STATIONARY = 'STATIONARY',
  MOBILE = 'MOBILE'
}

export enum UserType {
  HUMAN = 'HUMAN',
  ANIMAL = 'ANIMAL'
}

export interface IDeviceStatus {
  isOnline: boolean;
  isCharging: boolean;
  signalStrength: number;
  lastUpdated: Date;
}

export interface IUserDetails {
  type: UserType;
  name: string;
  identifier: string; // ID number for humans, microchip/tag number for animals
  species?: string; // For animals only
  breed?: string; // For animals only
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  contactInfo?: string; // Emergency contact for humans, owner contact for animals
  medicalInfo?: string;
}

export interface IDevice extends Document {
  name: string;
  type: DeviceType;
  batteryLevel: number;
  lastSeen: Date;
  status: IDeviceStatus;
  user: IUserDetails;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceStatusSchema = new Schema({
  isOnline: { type: Boolean, default: true },
  isCharging: { type: Boolean, default: false },
  signalStrength: { type: Number, default: 100 },
  lastUpdated: { type: Date, default: Date.now }
});

const UserDetailsSchema = new Schema({
  type: { 
    type: String,
    enum: Object.values(UserType),
    required: [true, 'User type is required']
  },
  name: { 
    type: String,
    required: [true, 'Name is required']
  },
  identifier: {
    type: String,
    required: [true, 'Identifier is required'],
    unique: true
  },
  species: String,
  breed: String,
  age: Number,
  gender: {
    type: String,
    enum: ['MALE', 'FEMALE', 'OTHER']
  },
  contactInfo: String,
  medicalInfo: String
});

const DeviceSchema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Device name is required'],
    unique: true
  },
  type: { 
    type: String, 
    enum: Object.values(DeviceType),
    required: [true, 'Device type is required']
  },
  batteryLevel: { 
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  lastSeen: { 
    type: Date,
    default: Date.now
  },
  status: {
    type: DeviceStatusSchema,
    default: () => ({})
  },
  user: {
    type: UserDetailsSchema,
    required: [true, 'User details are required']
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
DeviceSchema.index({ name: 1 });
DeviceSchema.index({ type: 1 });
DeviceSchema.index({ 'status.isOnline': 1 });
DeviceSchema.index({ 'user.type': 1 });
DeviceSchema.index({ 'user.identifier': 1 });

export default mongoose.model<IDevice>('Device', DeviceSchema);
