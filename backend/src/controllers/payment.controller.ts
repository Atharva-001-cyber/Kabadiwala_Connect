import { Response } from 'express';
import { db } from '../db/store';
import { AuthRequest } from '../middleware/auth.middleware';

export const getCollectorLedger = async (req: AuthRequest, res: Response) => {
  try {
    const { collectorId } = req.params;

    let targetCollectorId = collectorId;
    if (!targetCollectorId && req.user) {
      const col = db.collectors.find(c => c.userId === req.user?.userId);
      if (col) targetCollectorId = col.id;
    }

    const collector = db.collectors.find(c => c.id === targetCollectorId || c.userId === targetCollectorId);
    if (!collector) {
      return res.status(404).json({ success: false, message: 'Collector profile not found.' });
    }

    // IDOR protection: Collectors can only view their own ledger
    if (req.user && req.user.role === 'COLLECTOR') {
      const callerCol = db.collectors.find(c => c.userId === req.user?.userId);
      if (callerCol && callerCol.id !== collector.id) {
        return res.status(403).json({ success: false, message: 'Forbidden: You cannot access another collector financial ledger.' });
      }
    }

    const collectorPayments = db.payments.filter(p => p.collectorId === collector.id);

    const now = Date.now();
    const oneDayAgo = now - 86400000;
    const sevenDaysAgo = now - 7 * 86400000;
    const thirtyDaysAgo = now - 30 * 86400000;

    let todayEarnings = 0;
    let weeklyEarnings = 0;
    let monthlyEarnings = 0;
    let totalEarnings = 0;
    let cashEarnings = 0;
    let upiEarnings = 0;

    collectorPayments.forEach(p => {
      const pTime = new Date(p.timestamp).getTime();
      totalEarnings += p.amount;
      if (p.paymentMethod === 'CASH') cashEarnings += p.amount;
      if (p.paymentMethod === 'UPI') upiEarnings += p.amount;

      if (pTime >= oneDayAgo) todayEarnings += p.amount;
      if (pTime >= sevenDaysAgo) weeklyEarnings += p.amount;
      if (pTime >= thirtyDaysAgo) monthlyEarnings += p.amount;
    });

    return res.json({
      success: true,
      collector: {
        id: collector.id,
        name: collector.name,
        phone: collector.phone,
        district: collector.district,
        preferredPaymentMethod: collector.preferredPaymentMethod
      },
      summary: {
        todayEarnings,
        weeklyEarnings,
        monthlyEarnings,
        totalEarnings,
        cashEarnings,
        upiEarnings,
        completedTransactionsCount: collectorPayments.length,
        unitEconomics: {
          totalWeightKg: collector.totalWeightCollected,
          formalPlatformEarnings: totalEarnings,
          estimatedInformalMiddlemanEarnings: Math.round(totalEarnings * 0.58),
          netUpliftAmount: Math.round(totalEarnings * 0.42),
          netUpliftPercentage: totalEarnings > 0 ? 72.4 : 0,
          provenance: 'DEMONSTRATION_FORMULA_MODEL',
          modelStatus: 'BENCHMARK_ASSUMPTION_BASED',
          assumptions: {
            informalBasePriceCutPercent: 25,
            informalScaleKattaiDeductionPercent: 10,
            informalTransportPenaltyPercent: 7,
            formalDirectRateRealizationPercent: 100
          },
          disclaimer: 'Illustrative economic benchmark model based on preliminary scrap market assumptions. Final empirical figures require physical field survey validation.'
        }
      },
      transactions: collectorPayments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch collector ledger', error: err.message });
  }
};

export const getRecyclerTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { recyclerId } = req.params;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let targetRecyclerId = recyclerId;

    if (req.user.role === 'RECYCLER') {
      const callerRec = db.recyclers.find(r => r.userId === req.user?.userId || r.contactPhone === req.user?.phone) ||
                        db.recyclers.find(r => r.id === (req.user as any)?.recyclerId);
      if (!callerRec) {
        return res.status(403).json({ success: false, message: 'Recycler facility profile not found.' });
      }
      // IDOR protection: If a route parameter recyclerId is passed and doesn't match caller's facility ID, reject with 403!
      if (recyclerId && recyclerId !== callerRec.id) {
        return res.status(403).json({ success: false, message: "Forbidden: You cannot access another facility's transactions." });
      }
      targetRecyclerId = callerRec.id;
    } else if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied.' });
    }

    if (!targetRecyclerId && req.user.role !== 'ADMIN') {
      return res.status(400).json({ success: false, message: 'Recycler ID required' });
    }

    const transactions = db.payments
      .filter(p => targetRecyclerId ? p.recyclerId === targetRecyclerId : true)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const totalPaid = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalWeight = transactions.reduce((sum, t) => sum + t.weight, 0);

    return res.json({
      success: true,
      summary: {
        totalTransactions: transactions.length,
        totalDisbursedINR: totalPaid,
        totalWeightKg: Math.round(totalWeight),
        platformLedgerNotice: 'Platform Internal Ledger Record (Direct Cash/UPI Settlement Log)'
      },
      transactions
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch recycler transactions', error: err.message });
  }
};

import { payoutService } from '../services/payout.service';

export const getPayoutConfig = async (req: any, res: Response) => {
  return res.json({
    success: true,
    payoutStatus: payoutService.getProviderStatus()
  });
};
