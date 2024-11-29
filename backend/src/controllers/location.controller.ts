import { Request, Response } from 'express';
import LocationHistory from '../models/LocationHistory';

export const updateLocation = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, accuracy, speed, altitude } = req.body;
    const userId = req.user._id;

    const location = new LocationHistory({
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
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Error updating location' });
  }
};

export const getLocationHistory = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;

    const query: any = { userId };

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const locations = await LocationHistory.find(query)
      .sort({ timestamp: -1 })
      .limit(1000); // Limit to prevent overwhelming response

    res.json(locations);
  } catch (error) {
    console.error('Get location history error:', error);
    res.status(500).json({ message: 'Error fetching location history' });
  }
};

export const getLastKnownLocation = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    const location = await LocationHistory.findOne({ userId })
      .sort({ timestamp: -1 });

    if (!location) {
      return res.status(404).json({ message: 'No location history found' });
    }

    res.json(location);
  } catch (error) {
    console.error('Get last known location error:', error);
    res.status(500).json({ message: 'Error fetching last known location' });
  }
};

export const shareLocation = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Share location error:', error);
    res.status(500).json({ message: 'Error sharing location' });
  }
};
