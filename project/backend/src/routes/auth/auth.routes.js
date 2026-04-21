const express = require('express');
const router = express.Router();
const {
  login, getMe, forgotPassword, resetPassword, refreshToken, changePassword,
  register, verifyEmail, resendVerification, acceptInvite,
  listPublicPlans, registerAdmin, activateSubscription,
} = require('../../controllers/auth/auth.controller');
const {
  startGoogleConnect, handleGoogleCallback, disconnectGoogle, getGoogleStatus,
} = require('../../controllers/auth/googleCalendar.controller');
const { protect } = require('../../middleware/auth.middleware');

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/register-admin', registerAdmin);
router.post('/activate-subscription', activateSubscription);
router.get('/plans', listPublicPlans);
router.post('/accept-invite', acceptInvite);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);
router.post('/refresh-token', refreshToken);

// Google OAuth callback — public because Google's redirect lands here without
// the user's JWT header. Auth is carried by the `state` param which this
// handler validates against the user's stored pendingState.
router.get('/google/callback', handleGoogleCallback);

// Protected routes
router.use(protect);
router.get('/me', getMe);
router.patch('/change-password', changePassword);
router.post('/resend-verification', resendVerification);
router.get('/google/connect', startGoogleConnect);
router.get('/google/status', getGoogleStatus);
router.post('/google/disconnect', disconnectGoogle);

module.exports = router;
