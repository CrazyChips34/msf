import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  isActive: boolean;
  lastLoginIP: string;
  hasEmergencyAccess: boolean;
  emergencyContacts: Array<{
    name: string;
    phone: string;
    email: string;
    relationship: string;
  }>;
  trustedDevices: Array<{
    deviceId: string;
    deviceName: string;
    lastSync: Date;
  }>;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'admin', 'emergency_responder'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginIP: {
    type: String,
    default: null
  },
  hasEmergencyAccess: {
    type: Boolean,
    default: false
  },
  emergencyContacts: [{
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    relationship: { type: String, required: true }
  }],
  trustedDevices: [{
    deviceId: { type: String, required: true },
    deviceName: { type: String, required: true },
    lastSync: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

export default mongoose.model<IUser>('User', UserSchema);
