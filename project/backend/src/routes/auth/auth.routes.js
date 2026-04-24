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


router.get('/google/callback', handleGoogleCallback);


router.use(protect);
router.get('/me', getMe);
router.patch('/change-password', changePassword);
router.post('/resend-verification', resendVerification);
router.get('/google/connect', startGoogleConnect);
router.get('/google/status', getGoogleStatus);
router.post('/google/disconnect', disconnectGoogle);

module.exports = router;
