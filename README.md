# MSF (My Safety First) Application

A comprehensive web-based safety application that empowers users with real-time alerts, location tracking, wearable device integration, and secure communication.

## Features

- Real-time location tracking and sharing
- Emergency alerts and notifications
- Smart journey monitoring
- Wearable device integration
- Secure authentication and data encryption
- Geofencing capabilities
- Health monitoring and fall detection

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- Socket.IO for real-time communications
- JWT for authentication
- WebSocket for real-time updates

### Frontend (Coming Soon)
- React.js
- Material UI
- Google Maps API
- Socket.IO client

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn
- Google Maps API key
- Twilio account (for SMS notifications)
- SendGrid account (for email notifications)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd msf-safety-app
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your configuration values.

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Location
- `POST /api/location` - Update user's current location
- `GET /api/location/history` - Get user's location history

### Emergency
- `POST /api/emergency` - Send emergency alert
- `POST /api/alert/smart` - Create smart alert

### Wearable
- `POST /api/wearable/integration` - Connect wearable device
- `POST /api/wearable/data` - Send wearable health data

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token

## Security

- All API endpoints are secured with JWT authentication
- Sensitive data is encrypted both in transit and at rest
- Password hashing using bcrypt
- Rate limiting and request validation
- CORS protection
- SSL/TLS encryption

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@msf-safety.com or create an issue in the repository.
