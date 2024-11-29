"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const location_routes_1 = __importDefault(require("./routes/location.routes"));
const emergency_routes_1 = __importDefault(require("./routes/emergency.routes"));
const wearable_routes_1 = __importDefault(require("./routes/wearable.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Database connection
mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/msf-safety-app')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));
// Routes
app.use('/api/location', location_routes_1.default);
app.use('/api/emergency', emergency_routes_1.default);
app.use('/api/wearable', wearable_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
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
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
