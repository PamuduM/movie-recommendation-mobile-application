const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const validateRequest = require('../middleware/validateRequest');
const auth = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

router.post('/register', authLimiter, [
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], validateRequest, userController.register);

router.post('/login', authLimiter, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], validateRequest, userController.login);

router.get('/search', auth, userController.searchUsers);

router.get('/me', auth, userController.getMe);

router.put('/me', auth, [
  body('username').optional().notEmpty().withMessage('Username cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('avatar').optional().isString().withMessage('Avatar must be a string'),
  body('bio').optional().isString().trim().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
], validateRequest, userController.updateProfile);

router.post('/password-reset/request', passwordResetLimiter, [
  body('email').isEmail().withMessage('Valid email is required'),
], validateRequest, userController.requestPasswordReset);

router.post('/password-reset/confirm', passwordResetLimiter, [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], validateRequest, userController.resetPassword);

router.post('/verify-email/request', [
  body('email').isEmail().withMessage('Valid email is required'),
], validateRequest, userController.requestEmailVerification);

router.post('/verify-email/confirm', [
  body('token').notEmpty().withMessage('Verification token is required'),
], validateRequest, userController.verifyEmail);

module.exports = router;
