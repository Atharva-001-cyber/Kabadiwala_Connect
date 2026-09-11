import { Router } from 'express';
import { authenticate, optionalAuthenticate, requireRole, requireAuthorizedRecycler } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

import * as authCtrl from '../controllers/auth.controller';
import * as lotCtrl from '../controllers/lot.controller';
import * as priceCtrl from '../controllers/price.controller';
import * as recyclerCtrl from '../controllers/recycler.controller';
import * as offerCtrl from '../controllers/offer.controller';
import * as pickupCtrl from '../controllers/pickup.controller';
import * as handoverCtrl from '../controllers/handover.controller';
import * as traceCtrl from '../controllers/traceability.controller';
import * as aiCtrl from '../controllers/ai.controller';
import * as safetyCtrl from '../controllers/safety.controller';
import * as payCtrl from '../controllers/payment.controller';
import * as adminCtrl from '../controllers/admin.controller';
import { smsService } from '../services/sms.service';

const router = Router();

// Auth Routes
router.post('/auth/send-otp', authCtrl.sendOtp);
router.post('/auth/verify-otp', authCtrl.verifyOtp);
router.get('/auth/sms-config', authCtrl.getSmsConfig);
router.get('/auth/me', authenticate, authCtrl.getMe);
router.patch('/auth/language', authenticate, authCtrl.updateLanguage);
router.patch('/auth/profile', authenticate, authCtrl.updateProfile);

// Secure test runner helper (Only accessible when explicit TEST_RUNNER or dev OTP mode is active)
if (process.env.SMS_PROVIDER === 'TEST_RUNNER' || (process.env.NODE_ENV !== 'production' && process.env.RECYCLER_OTP_DEV_MODE === 'true')) {
  router.get('/auth/test-dispatched-otp', (req, res) => {
    const phone = String(req.query.phone || '');
    return res.json({ otp: smsService.getTestDispatchedOtp(phone) });
  });
}

// Lot Routes
router.get('/lots', authenticate, lotCtrl.getLots);
router.get('/lots/:id', authenticate, lotCtrl.getLotById);
router.post('/lots', authenticate, lotCtrl.createLot);
router.post('/lots/sync-batch', authenticate, lotCtrl.batchSyncLots);

// Price Routes
router.get('/prices/board', priceCtrl.getPriceBoard);
router.get('/prices/history', priceCtrl.getPriceHistory);
router.post('/prices/update', authenticate, priceCtrl.updateObservedPrice);
router.post('/prices/estimate', priceCtrl.estimateLotValue);

// Recycler Routes
router.get('/recyclers/cpcb-registry', recyclerCtrl.searchCpcbRegistry);
router.get('/recyclers', recyclerCtrl.getRecyclers);
router.get('/recyclers/:id', recyclerCtrl.getRecyclerById);
router.patch('/recyclers/:id/auth-status', authenticate, requireRole('ADMIN'), recyclerCtrl.updateRecyclerAuthStatus);
router.patch('/admin/recyclers/:id/status', authenticate, requireRole('ADMIN'), recyclerCtrl.updateRecyclerAuthStatus);

// Offer Routes
router.post('/offers', authenticate, requireAuthorizedRecycler, offerCtrl.createOffer);
router.post('/offers/request-quote', authenticate, offerCtrl.requestRecyclerQuote);
router.get('/offers/compare/:lotId', offerCtrl.compareOffersForLot);
router.patch('/offers/:id/accept', authenticate, offerCtrl.acceptOffer);

// Pickup Routes
router.get('/pickups', authenticate, pickupCtrl.getPickups);
router.post('/pickups/schedule', authenticate, requireAuthorizedRecycler, pickupCtrl.schedulePickup);

// Handover Routes
router.post('/handovers/verify', authenticate, requireAuthorizedRecycler, handoverCtrl.verifyHandover);
router.get('/handovers/lot/:lotId', authenticate, handoverCtrl.getHandoverByLotId);

// Traceability Routes
router.get('/traceability/:lotId/verify-integrity', traceCtrl.verifyTraceabilityIntegrity);
router.get('/traceability/:lotId', traceCtrl.getTraceabilityByLotId);
router.post('/traceability/stage', authenticate, requireAuthorizedRecycler, traceCtrl.updateProcessingStage);

// AI & ML Feedback
router.post('/ai/classify', upload.single('image'), aiCtrl.classifyImage);
router.post('/ai/valuation', aiCtrl.predictValuation);
router.post('/ai/feedback', aiCtrl.recordMLFeedback);

// Safety Center
router.get('/safety', safetyCtrl.getSafetyGuides);

// Payment & Ledger Routes
router.get('/payments/payout-config', payCtrl.getPayoutConfig);
router.get('/payments/collector/:collectorId?', authenticate, payCtrl.getCollectorLedger);
router.get('/payments/recycler/:recyclerId?', authenticate, payCtrl.getRecyclerTransactions);

// Admin Routes
router.get('/admin/kpis', authenticate, requireRole('ADMIN'), adminCtrl.getAdminKPIs);
router.get('/admin/map', adminCtrl.getMapData);
router.get('/admin/anomalies', authenticate, requireRole('ADMIN'), adminCtrl.getAnomalies);
router.patch('/admin/anomalies/:id', authenticate, requireRole('ADMIN'), adminCtrl.updateAnomalyStatus);
router.get('/admin/disputes', authenticate, requireRole('ADMIN'), adminCtrl.getDisputes);
router.patch('/admin/disputes/:id', authenticate, requireRole('ADMIN'), adminCtrl.updateDisputeStatus);
router.get('/admin/datasets/export/ml-training', authenticate, requireRole('ADMIN'), adminCtrl.getMLTrainingExport);
router.get('/admin/datasets/:name', adminCtrl.getExportableDataset);

export default router;
