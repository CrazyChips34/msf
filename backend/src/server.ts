import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import locationRoutes from './routes/location.routes';
import emergencyRoutes from './routes/emergency.routes';
import wearableRoutes from './routes/wearable.routes';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/msf-safety-app')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/location', locationRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/wearable', wearableRoutes);
app.use('/api/auth', authRoutes);

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('location-update', (data) => {
    // Broadcast location updates to trusted contacts
    socket.broadcast.emit('location-updated', data);
  });

  socket.on('emergency-alert', (data) => {
    // Broadcast emergency alerts to trusted contacts and emergency services
    socket.broadcast.emit('emergency-triggered', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
