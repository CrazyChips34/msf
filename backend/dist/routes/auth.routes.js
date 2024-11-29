"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const joi_1 = __importDefault(require("joi"));
const auth_middleware_2 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Validation schemas
const registerSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(8).required(),
    firstName: joi_1.default.string().required(),
    lastName: joi_1.default.string().required(),
    phone: joi_1.default.string().required()
});
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required()
});
const updateProfileSchema = joi_1.default.object({
    firstName: joi_1.default.string().required(),
    lastName: joi_1.default.string().required(),
    phone: joi_1.default.string().required()
});
// Routes
router.post('/register', (0, auth_middleware_2.validateRequest)(registerSchema), auth_controller_1.register);
router.post('/login', (0, auth_middleware_2.validateRequest)(loginSchema), auth_controller_1.login);
router.get('/profile', auth_middleware_1.authenticateToken, auth_controller_1.getProfile);
router.put('/profile', auth_middleware_1.authenticateToken, (0, auth_middleware_2.validateRequest)(updateProfileSchema), auth_controller_1.updateProfile);
exports.default = router;
