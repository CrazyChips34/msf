"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shareLocation = exports.getLastKnownLocation = exports.getLocationHistory = exports.updateLocation = void 0;
const LocationHistory_1 = __importDefault(require("../models/LocationHistory"));
const updateLocation = async (req, res) => {
    try {
        const { latitude, longitude, accuracy, speed, altitude } = req.body;
        const userId = req.user._id;
        const location = new LocationHistory_1.default({
            userId,
            latitude,
            longitude,
            accuracy,
            speed,
            altitude,
            timestamp: new Date()
        });
        await location.save();
        // Emit location update through WebSocket if needed
        // req.app.get('io').emit(`location-${userId}`, location);
        res.status(201).json({
            message: 'Location updated successfully',
            location
        });
    }
    catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ message: 'Error updating location' });
    }
};
exports.updateLocation = updateLocation;
const getLocationHistory = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user._id;
        const query = { userId };
        if (startDate && endDate) {
            query.timestamp = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        const locations = await LocationHistory_1.default.find(query)
            .sort({ timestamp: -1 })
            .limit(1000); // Limit to prevent overwhelming response
        res.json(locations);
    }
    catch (error) {
        console.error('Get location history error:', error);
        res.status(500).json({ message: 'Error fetching location history' });
    }
};
exports.getLocationHistory = getLocationHistory;
const getLastKnownLocation = async (req, res) => {
    try {
        const userId = req.user._id;
        const location = await LocationHistory_1.default.findOne({ userId })
            .sort({ timestamp: -1 });
        if (!location) {
            return res.status(404).json({ message: 'No location history found' });
        }
        res.json(location);
    }
    catch (error) {
        console.error('Get last known location error:', error);
        res.status(500).json({ message: 'Error fetching last known location' });
    }
};
exports.getLastKnownLocation = getLastKnownLocation;
const shareLocation = async (req, res) => {
    try {
        const { userId } = req.user;
        const { shareWith, duration } = req.body;
        // Generate a unique sharing token
        const sharingToken = Math.random().toString(36).substring(2, 15);
        // Store sharing information (implement this based on your requirements)
        // await LocationSharing.create({ userId, shareWith, token: sharingToken, expiresAt: ... });
        const sharingLink = `${process.env.FRONTEND_URL}/share-location/${sharingToken}`;
        res.json({
            message: 'Location sharing enabled',
            sharingLink,
            expiresIn: duration
        });
    }
    catch (error) {
        console.error('Share location error:', error);
        res.status(500).json({ message: 'Error sharing location' });
    }
};
exports.shareLocation = shareLocation;
