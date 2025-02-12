import { Request, Response } from 'express';
import EmergencyAlert from '../models/EmergencyAlert';
import User from '../models/User';
// import { sendSMS } from '../services/twilio.service';
// import { sendEmail } from '../services/email.service';

export const createEmergencyAlert = async (req: Request, res: Response) => {
  try {
    const { alertType, latitude, longitude, healthData, description } = req.body;
    const userId = req.user._id;

    const alert = new EmergencyAlert({
      userId,
      alertType,
      latitude,
      longitude,
      healthData,
      description,
      status: 'ACTIVE',
      timestamp: new Date()
    });

    await alert.save();

    // Get user's emergency contacts
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Notify emergency contacts (implement these services as needed)
    // for (const contact of user.emergencyContacts) {
    //   await sendSMS(contact.phone, `Emergency Alert: ${user.firstName} ${user.lastName} needs help!
    //     Location: https://maps.google.com/?q=${latitude},${longitude}`);
    //   await sendEmail(contact.email, 'Emergency Alert',
    //     `${user.firstName} ${user.lastName} has triggered an emergency alert.
    //     Location: https://maps.google.com/?q=${latitude},${longitude}`);
    // }

    // Emit emergency alert through WebSocket
    req.app.get('io').emit(`emergency-${userId}`, alert);

    res.status(201).json({
      message: 'Emergency alert created and notifications sent',
      alert
    });
  } catch (error) {
    console.error('Create emergency alert error:', error);
    res.status(500).json({ message: 'Error creating emergency alert' });
  }
};

export const updateAlertStatus = async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    const alert = await EmergencyAlert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Only allow the user who created the alert or their emergency contacts to update it
    const user = await User.findById(alert.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isEmergencyContact = user.emergencyContacts.some(
      contact => contact.email === req.user.email
    );

    if (alert.userId.toString() !== userId.toString() && !isEmergencyContact) {
      return res.status(403).json({ message: 'Not authorized to update this alert' });
    }

    alert.status = status;
    if (status === 'RESOLVED') {
      alert.resolvedAt = new Date();
      alert.resolvedBy = userId;
    }

    await alert.save();

    // Emit status update through WebSocket
    req.app.get('io').emit(`emergency-status-${alert.userId}`, alert);

    res.json({
      message: 'Alert status updated successfully',
      alert
    });
  } catch (error) {
    console.error('Update alert status error:', error);
    res.status(500).json({ message: 'Error updating alert status' });
  }
};

export const getActiveAlerts = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    // Get user's active alerts and alerts from people they are emergency contacts for
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alerts = await EmergencyAlert.find({
      $or: [
        { userId, status: 'ACTIVE' },
        {
          userId: { $in: user.emergencyContacts.map(contact => contact._id) },
          status: 'ACTIVE'
        }
      ]
    }).sort({ timestamp: -1 });

    res.json(alerts);
  } catch (error) {
    console.error('Get active alerts error:', error);
    res.status(500).json({ message: 'Error fetching active alerts' });
  }
};

export const getAlertHistory = async (req: Request, res: Response) => {
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

    const alerts = await EmergencyAlert.find(query)
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(alerts);
  } catch (error) {
    console.error('Get alert history error:', error);
    res.status(500).json({ message: 'Error fetching alert history' });
  }
};
