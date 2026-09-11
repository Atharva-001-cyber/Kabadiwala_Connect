import { Request, Response } from 'express';
import { db } from '../db/store';
import { AuthRequest } from '../middleware/auth.middleware';
import { AnomalyStatus, DisputeStatus } from '../types';

export const getAdminKPIs = async (req: Request, res: Response) => {
  try {
    const totalCollectors = db.collectors.length;
    const totalRecyclers = db.recyclers.length;
    const authorizedRecyclers = db.recyclers.filter(r => r.authorizationStatus === 'AUTHORIZED').length;
    const totalLots = db.lots.length;
    const totalWeightCollected = db.lots.reduce((sum, l) => sum + (l.approxWeight || 0), 0);
    const recycledLots = db.lots.filter(l => l.status === 'RECYCLED');
    const totalWeightRecycled = recycledLots.reduce((sum, l) => sum + (l.approxWeight || 0), 0);
    const totalTransactions = db.payments.length;
    const totalDisbursedValue = db.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const openAnomalies = db.anomalies.filter(a => a.status === 'OPEN' || a.status === 'UNDER_REVIEW').length;
    const openDisputes = db.disputes.filter(d => d.status === 'UNDER_REVIEW').length;

    // Material volume breakdown
    const materialBreakdown: Record<string, number> = {};
    db.lots.forEach(l => {
      materialBreakdown[l.materialCategory] = (materialBreakdown[l.materialCategory] || 0) + l.approxWeight;
    });

    return res.json({
      success: true,
      kpis: {
        totalCollectors,
        totalRecyclers,
        authorizedRecyclers,
        totalLots,
        totalWeightCollectedKg: Math.round(totalWeightCollected),
        totalWeightRecycledKg: Math.round(totalWeightRecycled),
        formalRecyclingRatePercent: totalWeightCollected > 0 ? Number(((totalWeightRecycled / totalWeightCollected) * 100).toFixed(1)) : 0,
        totalTransactions,
        totalDisbursedValueINR: totalDisbursedValue,
        openAnomalies,
        openDisputes
      },
      materialBreakdown
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin KPIs', error: err.message });
  }
};

export const getMapData = async (req: Request, res: Response) => {
  try {
    const recyclers = db.recyclers.map(r => ({
      id: r.id,
      name: r.facilityName,
      status: r.authorizationStatus,
      lat: r.latitude,
      lng: r.longitude,
      district: r.district,
      state: r.state,
      acceptedMaterials: r.acceptedMaterials,
      totalProcessedKg: r.totalProcessedKg,
      phone: r.contactPhone
    }));

    // Aggregated district collection clusters
    const districtClusters = [
      { district: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, totalLots: 18, totalWeightKg: 245, activeCollectors: 12 },
      { district: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, totalLots: 24, totalWeightKg: 420, activeCollectors: 16 },
      { district: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882, totalLots: 9, totalWeightKg: 130, activeCollectors: 7 },
      { district: 'Delhi NCR', state: 'Delhi', lat: 28.6139, lng: 77.2090, totalLots: 32, totalWeightKg: 580, activeCollectors: 22 },
      { district: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, totalLots: 28, totalWeightKg: 490, activeCollectors: 19 }
    ];

    return res.json({
      success: true,
      recyclers,
      collectionClusters: districtClusters
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch map data', error: err.message });
  }
};

export const getAnomalies = async (req: Request, res: Response) => {
  try {
    const anomalies = db.anomalies.map(a => {
      const lot = db.lots.find(l => l.id === a.lotId);
      return {
        ...a,
        lotCategory: lot?.materialCategory,
        approxWeight: lot?.approxWeight,
        collectorName: lot?.collectorName,
        district: lot?.locationDistrict
      };
    });

    return res.json({
      success: true,
      count: anomalies.length,
      anomalies
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch anomalies', error: err.message });
  }
};

export const updateAnomalyStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const anomaly = db.anomalies.find(a => a.id === id);
    if (!anomaly) {
      return res.status(404).json({ success: false, message: 'Anomaly flag not found' });
    }

    anomaly.status = status as AnomalyStatus;
    db.save();

    return res.json({ success: true, message: `Anomaly updated to ${status}`, anomaly });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update anomaly', error: err.message });
  }
};

export const getDisputes = async (req: Request, res: Response) => {
  try {
    return res.json({
      success: true,
      count: db.disputes.length,
      disputes: db.disputes
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch disputes', error: err.message });
  }
};

export const updateDisputeStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, resolution } = req.body;

    const dispute = db.disputes.find(d => d.id === id);
    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    dispute.status = status as DisputeStatus;
    if (adminNotes) dispute.adminNotes = adminNotes;
    if (resolution) dispute.resolution = resolution;
    if (status === 'RESOLVED') dispute.resolvedAt = new Date().toISOString();

    db.save();

    return res.json({ success: true, message: `Dispute status updated to ${status}`, dispute });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update dispute', error: err.message });
  }
};

export const getExportableDataset = async (req: Request, res: Response) => {
  try {
    const name = req.params.name || 'transactions';
    const format = (req.query.format || req.params.format || 'json').toString().toLowerCase();

    let datasetData: any[] = [];
    if (name === 'materials') datasetData = db.lots;
    else if (name === 'prices') datasetData = db.prices;
    else if (name === 'recyclers') datasetData = db.recyclers;
    else if (name === 'transactions') datasetData = db.payments;
    else if (name === 'traceability') datasetData = db.traceabilityLogs;
    else if (name === 'collectors') datasetData = db.collectors;
    else if (name === 'ml' || name === 'mlTrainingSamples') datasetData = db.mlTrainingSamples;
    else datasetData = db.lots;

    if (format === 'csv') {
      if (datasetData.length === 0) return res.send('');
      const headers = Object.keys(datasetData[0]).join(',');
      const rows = datasetData.map(item => 
        Object.values(item).map(v => typeof v === 'object' ? `"${JSON.stringify(v).replace(/"/g, '""')}"` : `"${String(v).replace(/"/g, '""')}"`).join(',')
      );
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="sih229_${name}_dataset.csv"`);
      return res.send([headers, ...rows].join('\n'));
    }

    return res.json({
      success: true,
      datasetName: name,
      recordCount: datasetData.length,
      generatedAt: new Date().toISOString(),
      records: datasetData
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to export dataset', error: err.message });
  }
};

import { mlDatasetService } from '../services/ml-dataset.service';

export const getMLTrainingExport = async (req: Request, res: Response) => {
  try {
    const samples = db.mlTrainingSamples;
    let totalOverrides = 0;

    samples.forEach(s => {
      if (s.isOverride) totalOverrides++;
    });

    const splitResult = mlDatasetService.validateAndSplitDataset(samples);

    const manifest = {
      datasetName: splitResult.datasetName,
      version: '1.1.0',
      totalSamplesCollected: samples.length,
      trainCount: splitResult.trainCount,
      valCount: splitResult.valCount,
      splitRatio: splitResult.splitRatio,
      overrideRatePercent: samples.length > 0 ? Number(((totalOverrides / samples.length) * 100).toFixed(1)) : 0,
      classes: splitResult.classes,
      classDistribution: splitResult.classDistribution,
      modelTrainingReadiness: splitResult.modelTrainingReadiness,
      exportFormatsSupported: ['YOLOv8', 'Pascal_VOC', 'COCO'],
      yoloConfigYaml: splitResult.yoloConfigYaml,
      generatedAt: new Date().toISOString(),
      samples: samples.map(s => ({
        sampleId: s.id,
        imagePath: s.imagePath,
        initialHeuristicPrediction: s.initialHeuristicPrediction,
        userConfirmedCategory: s.userConfirmedCategory,
        isHumanOverride: s.isOverride,
        collectorId: s.collectorId,
        district: s.district,
        timestamp: s.timestamp
      }))
    };

    return res.json({
      success: true,
      manifest
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to export ML dataset manifest', error: err.message });
  }
};
