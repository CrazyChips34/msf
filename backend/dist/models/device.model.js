"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserType = exports.DeviceType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var DeviceType;
(function (DeviceType) {
    DeviceType["WEARABLE"] = "WEARABLE";
    DeviceType["STATIONARY"] = "STATIONARY";
    DeviceType["MOBILE"] = "MOBILE";
})(DeviceType || (exports.DeviceType = DeviceType = {}));
var UserType;
(function (UserType) {
    UserType["HUMAN"] = "HUMAN";
    UserType["ANIMAL"] = "ANIMAL";
})(UserType || (exports.UserType = UserType = {}));
const DeviceStatusSchema = new mongoose_1.Schema({
    isOnline: { type: Boolean, default: true },
    isCharging: { type: Boolean, default: false },
    signalStrength: { type: Number, default: 100 },
    lastUpdated: { type: Date, default: Date.now }
});
const UserDetailsSchema = new mongoose_1.Schema({
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
const DeviceSchema = new mongoose_1.Schema({
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
exports.default = mongoose_1.default.model('Device', DeviceSchema);
