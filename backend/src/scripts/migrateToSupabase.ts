import dotenv from 'dotenv';
import path from 'path';

// Ensure .env is always loaded reliably
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import fs from 'fs';
import { supabase, isSupabaseConfigured } from '../db/supabase';

async function migrate() {
  console.log('\n============================================================');
  console.log('🚀 KABADIWALA CONNECT — SUPABASE DATA MIGRATION PIPELINE');
  console.log('============================================================\n');

  if (!isSupabaseConfigured() || !supabase) {
    console.error('❌ Supabase is not configured! Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
    process.exit(1);
  }

  const dbPath = path.join(__dirname, '../../data/db.json');
  if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file backend/data/db.json not found!');
    process.exit(1);
  }

  const raw = fs.readFileSync(dbPath, 'utf-8');
  const dbData = JSON.parse(raw);

  console.log('📦 Loaded local db.json successfully. Beginning upload to Supabase...\n');

  // Helper to chunk upserts into batches of 100 with deduplication to avoid PostgreSQL ON CONFLICT error
  const upsertBatch = async (tableName: string, records: any[]) => {
    if (!records || records.length === 0) {
      console.log(`  ⚪ Table '${tableName}': 0 records (skipped).`);
      return;
    }

    // Deduplicate records by id
    const uniqueMap = new Map<string, any>();
    for (const item of records) {
      if (item && item.id) {
        uniqueMap.set(item.id, item);
      }
    }
    const dedupedRecords = Array.from(uniqueMap.values());

    const batchSize = 100;
    let successCount = 0;

    for (let i = 0; i < dedupedRecords.length; i += batchSize) {
      const batch = dedupedRecords.slice(i, i + batchSize);
      const { error } = await supabase!.from(tableName).upsert(batch);
      if (error) {
        console.error(`  ❌ Error uploading batch to '${tableName}':`, error.message);
      } else {
        successCount += batch.length;
      }
    }
    console.log(`  ✅ Table '${tableName}': ${successCount} / ${dedupedRecords.length} records successfully synced.`);
  };

  // 1. Users
  await upsertBatch('users', (dbData.users || []).map((u: any) => ({
    id: u.id,
    phone: u.phone,
    role: u.role,
    language: u.language || 'hi',
    name: u.name,
    created_at: u.createdAt || new Date().toISOString()
  })));

  // 2. Collectors
  await upsertBatch('collectors', (dbData.collectors || []).map((c: any) => ({
    id: c.id,
    user_id: c.userId,
    name: c.name,
    phone: c.phone,
    district: c.district,
    state: c.state,
    address: c.address,
    latitude: c.latitude,
    longitude: c.longitude,
    kyc_status: c.kycStatus || 'NOT_SUBMITTED',
    badge: c.badge,
    total_weight_collected: c.totalWeightCollected || 0,
    total_lots_created: c.totalLotsCreated || 0,
    total_earnings: c.totalEarnings || 0,
    upi_id: c.upiId,
    data_source: c.dataSource || 'LIVE',
    created_at: c.createdAt || new Date().toISOString()
  })));

  // 3. Recyclers
  await upsertBatch('recyclers', (dbData.recyclers || []).map((r: any) => ({
    id: r.id,
    user_id: r.userId,
    facility_name: r.facilityName,
    registration_no: r.registrationNo,
    authorization_status: r.authorizationStatus || 'AUTHORIZED',
    authorization_source: r.authorizationSource || 'PLATFORM_MANAGED',
    auth_valid_until: r.authValidUntil || '2030-12-31',
    contact_person: r.contactPerson,
    contact_phone: r.contactPhone,
    district: r.district,
    state: r.state,
    address: r.address,
    latitude: r.latitude,
    longitude: r.longitude,
    accepted_materials: r.acceptedMaterials || [],
    pickup_available: r.pickupAvailable ?? true,
    service_radius_km: r.serviceRadiusKm || 25,
    base_offered_rates: r.baseOfferedRates || {},
    rating: r.rating || 4.5,
    total_processed_kg: r.totalProcessedKg || 0,
    data_source: r.dataSource || 'LIVE',
    created_at: r.createdAt || new Date().toISOString()
  })));

  // Known recycler IDs set
  const validRecyclerIds = new Set((dbData.recyclers || []).map((r: any) => r.id));

  // 4. Lots
  await upsertBatch('lots', (dbData.lots || []).map((l: any) => ({
    id: l.id,
    collector_id: l.collectorId,
    collector_name: l.collectorName,
    collector_phone: l.collectorPhone,
    material_category: l.materialCategory,
    sub_category: l.subCategory,
    description: l.description,
    image_url: l.imageUrl,
    image_urls: l.imageUrls || [],
    approx_weight: l.approxWeight,
    actual_weight: l.actualWeight,
    condition: l.condition,
    source_type: l.sourceType,
    location_district: l.locationDistrict,
    location_state: l.locationState,
    estimated_value_min: l.estimatedValueMin,
    estimated_value_max: l.estimatedValueMax,
    estimated_value_avg: l.estimatedValueAvg,
    quoted_price: l.quotedPrice,
    final_sale_value: l.finalSaleValue,
    selected_recycler_id: l.selectedRecyclerId,
    selected_offer_id: l.selectedOfferId,
    handover_otp: l.handoverOtp,
    status: l.status,
    data_source: l.dataSource || 'LIVE',
    created_at: l.createdAt || new Date().toISOString(),
    updated_at: l.updatedAt || new Date().toISOString()
  })));

  // 5. Offers
  await upsertBatch('offers', (dbData.offers || []).map((o: any) => {
    let recId = o.recyclerId;
    if (!validRecyclerIds.has(recId)) {
      recId = 'rec_avadh_1'; // fallback to mapped facility
    }
    return {
      id: o.id,
      lot_id: o.lotId,
      recycler_id: recId,
      recycler_name: o.recyclerName,
      material_category: o.materialCategory || '',
      offered_rate_per_kg: o.offeredRatePerKg,
      quoted_total_price: o.totalOfferedPrice || o.quotedTotalPrice || 0,
      pickup_offered: o.pickupOffered ?? true,
      pickup_charge_deduction: o.pickupChargeDeduction || 0,
      net_collector_payout: o.netCollectorPayout || o.totalOfferedPrice || 0,
      estimated_pickup_date: o.estimatedPickupDate || '',
      status: o.status,
      expires_at: o.expiresAt || null,
      created_at: o.createdAt || new Date().toISOString()
    };
  }));

  // 6. Pickups
  await upsertBatch('pickups', (dbData.pickups || []).map((p: any) => ({
    id: p.id,
    lot_id: p.lotId,
    offer_id: p.offerId || null,
    collector_id: p.collectorId,
    recycler_id: p.recyclerId,
    scheduled_date: p.scheduledDate,
    scheduled_time_slot: p.timeSlot || p.scheduledTimeSlot || '10:00 - 13:00',
    driver_name: p.driverName || 'Designated Pickup Agent',
    driver_phone: p.driverContact || p.driverPhone || '9876543210',
    vehicle_number: p.vehicleNumber || 'UP-32-EW-2026',
    pickup_status: p.status || p.pickupStatus || 'CONFIRMED',
    pickup_address: p.pickupAddress || 'Collector Registered Address',
    collector_phone: p.collectorPhone || '9876543210',
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: p.updatedAt || new Date().toISOString()
  })));

  // 7. Handovers
  await upsertBatch('handovers', (dbData.handovers || []).map((h: any) => ({
    id: h.id,
    lot_id: h.lotId,
    pickup_id: h.pickupId || null,
    collector_id: h.collectorId,
    recycler_id: h.recyclerId,
    recycler_name: h.recyclerName || '',
    approx_weight: h.approxWeight ?? h.initialEstimatedWeight ?? h.actualWeight ?? 0,
    initial_estimated_weight: h.initialEstimatedWeight ?? h.approxWeight ?? h.actualWeight ?? 0,
    actual_weight: h.actualWeight,
    weight_difference: h.weightDifference || 0,
    weight_diff_percentage: h.weightDiffPercentage || 0,
    proof_image_url: h.proofImageUrl || '',
    handover_otp: h.handoverOtp,
    gps_location: h.gpsLocation || {},
    location_source: h.locationSource || 'DEVICE_GPS',
    device_accuracy_meters: h.deviceAccuracyMeters || 5.0,
    verified_by_recycler_name: h.verifiedByRecyclerName,
    payment_method: h.paymentMethod || 'OFFLINE_CASH',
    payment_record_type: h.paymentRecordType || 'OFFLINE_CASH',
    external_gateway_status: h.externalGatewayStatus || 'SUCCESS',
    final_payment_amount: h.finalPaymentAmount || 0,
    timestamp: h.timestamp || new Date().toISOString()
  })));

  // 8. Traceability Logs (Merkle Chain)
  await upsertBatch('traceability_logs', (dbData.traceabilityLogs || []).map((t: any) => ({
    id: t.id,
    lot_id: t.lotId,
    stage: t.stage,
    actor_role: t.actorRole,
    actor_name: t.actorName,
    facility_location: t.facilityLocation,
    timestamp: t.timestamp,
    title: t.title,
    description: t.description,
    data_source: t.dataSource || 'LIVE',
    previous_event_hash: t.previousEventHash,
    payload_hash: t.payloadHash,
    event_hash: t.eventHash
  })));

  // 9. Prices
  await upsertBatch('prices', (dbData.prices || []).map((pr: any) => ({
    id: pr.id,
    district: pr.district,
    state: pr.state,
    material_category: pr.materialCategory,
    prevailing_buy_price: pr.prevailingBuyPrice,
    min_price: pr.minPrice,
    max_price: pr.maxPrice,
    trend: pr.trend || 'STABLE',
    source_type: pr.sourceType || 'ADMIN_BENCHMARK',
    last_updated: pr.updatedAt || pr.lastUpdated || new Date().toISOString()
  })));

  // 10. Price History
  await upsertBatch('price_history_log', (dbData.priceHistoryLog || []).map((ph: any) => ({
    id: ph.id,
    district: ph.district,
    material_category: ph.materialCategory,
    rate: ph.ratePerKg || ph.rate || 0,
    date: ph.observedAt || ph.date || new Date().toISOString(),
    source: ph.source || 'Mandi Audit'
  })));

  // 11. Payments
  await upsertBatch('payments', (dbData.payments || []).map((pay: any) => ({
    id: pay.id,
    lot_id: pay.lotId,
    collector_id: pay.collectorId,
    recycler_id: pay.recyclerId,
    recycler_name: pay.recyclerName,
    material_category: pay.materialCategory,
    weight: pay.weight,
    rate_per_kg: pay.ratePerKg,
    amount: pay.amount,
    payment_method: pay.paymentMethod || 'OFFLINE_CASH',
    record_type: pay.recordType || 'OFFLINE_CASH',
    payout_status: pay.payoutStatus || 'COMPLETED',
    external_gateway_status: pay.externalGatewayStatus || 'SUCCESS',
    status: pay.status || 'COMPLETED',
    transaction_ref: pay.transactionRef || '',
    data_source: pay.dataSource || 'LIVE',
    timestamp: pay.timestamp || new Date().toISOString()
  })));

  // 12. Anomalies
  await upsertBatch('anomalies', (dbData.anomalies || []).map((a: any) => ({
    id: a.id,
    type: a.anomalyType || a.type || 'PRICE_OUTLIER',
    severity: a.severity || 'LOW',
    entity_type: a.entityType || 'LOT',
    entity_id: a.entityId || a.lotId || '',
    description: a.description || '',
    status: a.status || 'OPEN',
    flagged_by: a.flaggedBy || a.collectorId || 'SYSTEM_AUDITOR',
    created_at: a.createdAt || new Date().toISOString(),
    resolved_at: a.resolvedAt || null,
    resolution_notes: a.resolutionNotes || null
  })));

  // 13. Disputes
  await upsertBatch('disputes', (dbData.disputes || []).map((d: any) => ({
    id: d.id,
    lot_id: d.lotId,
    collector_id: d.collectorId || 'col_1',
    recycler_id: d.recyclerId || 'rec_1',
    reason: d.reason || 'Tare Weight Verification',
    description: d.details || d.description || '',
    status: d.status || 'RESOLVED',
    created_at: d.createdAt || new Date().toISOString(),
    resolved_at: d.resolvedAt || null,
    resolution_notes: d.resolution || d.adminNotes || d.resolutionNotes || null
  })));

  // 14. ML Training Samples
  await upsertBatch('ml_training_samples', (dbData.mlTrainingSamples || []).map((m: any) => ({
    id: m.id,
    lot_id: m.lotId,
    image_path: m.imagePath,
    initial_heuristic_prediction: m.initialHeuristicPrediction,
    user_confirmed_category: m.userConfirmedCategory,
    is_override: m.isOverride ?? false,
    collector_id: m.collectorId,
    district: m.district,
    timestamp: m.timestamp || new Date().toISOString()
  })));

  // 15. CPCB Master Registry
  const cpcbRecords = (dbData.cpcbMasterRegistry || []).map((c: any) => ({
    registration_no: c.registrationNo,
    facility_name: c.facilityName,
    state: c.state,
    district: c.district,
    address: c.address,
    authorized_capacity_mta: c.authorizedCapacityMTA,
    valid_until: c.validUntil,
    categories_authorized: c.categoriesAuthorized || []
  }));
  const { error: cpcbErr } = await supabase!.from('cpcb_master_registry').upsert(cpcbRecords);
  if (cpcbErr) {
    console.error("  ❌ Error uploading 'cpcb_master_registry':", cpcbErr.message);
  } else {
    console.log(`  ✅ Table 'cpcb_master_registry': ${cpcbRecords.length} / ${cpcbRecords.length} records successfully synced.`);
  }

  console.log('\n============================================================');
  console.log('🎉 ALL PROJECT DATA SUCCESSFULLY MIGRATED TO SUPABASE!');
  console.log('============================================================\n');
}

migrate().catch(err => {
  console.error('Migration failed with unexpected error:', err);
  process.exit(1);
});
