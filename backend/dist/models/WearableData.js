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
const mongoose_1 = __importStar(require("mongoose"));
const WearableDataSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
exports.default = mongoose_1.default.model('WearableData', WearableDataSchema);
