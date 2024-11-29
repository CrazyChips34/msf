"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = exports.authorize = exports.authenticateToken = exports.blacklistToken = exports.emergencyRateLimiter = exports.apiRateLimiter = exports.authRateLimiter = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_rate_limit_1 = require("express-rate-limit");
const User_1 = __importDefault(require("../models/User"));
// Strict rate limiting for authentication endpoints
exports.authRateLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per window
    message: 'Too many login attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});
// Less strict rate limiting for general API endpoints
exports.apiRateLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // limit each IP to 100 requests per window
    message: 'Too many requests, please try again after 5 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});
// Emergency endpoints have no rate limiting
exports.emergencyRateLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // Higher limit for emergency situations
    message: 'Emergency system is currently overwhelmed, please try alternative emergency contacts',
    standardHeaders: true,
    legacyHeaders: false,
});
const tokenBlacklist = new Map();
// Clean up expired blacklisted tokens every hour
setInterval(() => {
    const now = Date.now();
    for (const [token, expiry] of tokenBlacklist.entries()) {
        if (expiry < now) {
            tokenBlacklist.delete(token);
        }
    }
}, 60 * 60 * 1000);
const blacklistToken = (token) => {
    // Store token in blacklist with 24h expiry
    tokenBlacklist.set(token, Date.now() + 24 * 60 * 60 * 1000);
};
exports.blacklistToken = blacklistToken;
// Session timeout (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;
const authenticateToken = async (req, res, next) => {
    var _a;
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication token required' });
        }
        // Check if token is blacklisted
        if (tokenBlacklist.has(token)) {
            return res.status(401).json({ message: 'Token has been revoked' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_secret');
        // Check token expiration
        if (Date.now() >= decoded.exp * 1000) {
            return res.status(401).json({ message: 'Token has expired' });
        }
        const user = await User_1.default.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        if (!user.isActive) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }
        // Check for suspicious activity
        if (user.lastLoginIP && user.lastLoginIP !== req.ip) {
            // Log suspicious activity
            console.warn(`Suspicious login attempt for user ${user.id} from IP ${req.ip}`);
        }
        // Check session timeout
        if ((_a = req.session) === null || _a === void 0 ? void 0 : _a.lastActivity) {
            const lastActivity = req.session.lastActivity;
            if (Date.now() - lastActivity > SESSION_TIMEOUT) {
                return res.status(401).json({ message: 'Session has expired, please login again' });
            }
        }
        // Update last activity
        if (req.session) {
            req.session.lastActivity = Date.now();
        }
        req.user = user;
        req.deviceId = decoded.deviceId;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({ message: 'Token has expired' });
        }
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.authenticateToken = authenticateToken;
// Role-based authorization with emergency override
const authorize = (roles, allowEmergency = false) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        // Allow emergency access if enabled and user has emergency flag
        if (allowEmergency && req.user.hasEmergencyAccess) {
            // Log emergency access
            console.warn(`Emergency access granted to ${req.user.id} for ${req.path}`);
            return next();
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        next();
    };
};
exports.authorize = authorize;
// Request validation with strict security checks
const validateRequest = (schema) => {
    return (req, res, next) => {
        // Sanitize input
        const sanitizedBody = sanitizeInput(req.body);
        req.body = sanitizedBody;
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            return res.status(400).json({
                message: 'Validation error',
                details: error.details.map((detail) => ({
                    message: detail.message,
                    path: detail.path.map(p => String(p)),
                    type: detail.type
                }))
            });
        }
        next();
    };
};
exports.validateRequest = validateRequest;
// Input sanitization function
const sanitizeInput = (input) => {
    if (typeof input !== 'object' || input === null) {
        return input;
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
        if (typeof value === 'string') {
            // Remove potential XSS content
            sanitized[key] = value
                .replace(/[<>]/g, '')
                .trim();
        }
        else if (typeof value === 'object') {
            sanitized[key] = sanitizeInput(value);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
};
