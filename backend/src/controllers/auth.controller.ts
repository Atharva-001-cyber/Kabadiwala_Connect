import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/store';
import { User, UserRole, Language, CollectorProfile, RecyclerProfile } from '../types';
import { JWT_SECRET, AuthRequest } from '../middleware/auth.middleware';
import { smsService } from '../services/sms.service';

import crypto from 'crypto';

interface CachedOtpRecord {
  otp: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  role?: UserRole;
  language?: Language;
  name?: string;
  isRealSms: boolean;
  createdAt: number;
}

// Store temporary OTPs in memory
const otpCache = new Map<string, CachedOtpRecord>();

export const sendOtp = async (req: Request, res: Response) => {
  const { phone, role = 'COLLECTOR', language = 'hi', name } = req.body;

  if (!phone || phone.length < 10) {
    return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number required.' });
  }

  const cleanPhone = phone.slice(-10);
  const isRecycler = role === 'RECYCLER';

  // Rate limiting check: Prevent rapid OTP requests within 30 seconds
  const existingOtp = otpCache.get(cleanPhone);
  if (existingOtp && Date.now() - existingOtp.createdAt < 30000) {
    const waitSeconds = Math.ceil((30000 - (Date.now() - existingOtp.createdAt)) / 1000);
    return res.status(429).json({
      success: false,
      message: `Please wait ${waitSeconds}s before requesting a new OTP.`
    });
  }

  // Generate OTP:
  // For RECYCLER: MUST be a cryptographically secure random 6-digit numeric code
  // For COLLECTOR in demo: allow standard demo number or random 4-digit code
  let otp: string;
  if (isRecycler) {
    otp = crypto.randomInt(100000, 999999).toString();
  } else {
    otp = (cleanPhone === '9876543210' || cleanPhone === '9999999999') ? '1234' : Math.floor(1000 + Math.random() * 9000).toString();
  }

  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpCache.set(cleanPhone, {
    otp,
    expiresAt,
    attempts: 0,
    maxAttempts: 5,
    role,
    language,
    name,
    isRealSms: isRecycler,
    createdAt: Date.now()
  });

  const sendResult = await smsService.sendOtp(cleanPhone, otp, { isRealRequired: isRecycler });

  // If real SMS is required (Recycler) and gateway is not configured or failed:
  if (isRecycler && !sendResult.success) {
    const isSimulateProd = req.headers['x-test-simulate-production'] === 'true' && process.env.NODE_ENV !== 'production';
    const isDevEnv = !isSimulateProd && (process.env.NODE_ENV || 'development').toLowerCase() === 'development';
    const isRecyclerDevMode = process.env.RECYCLER_OTP_DEV_MODE === 'true';

    if (isDevEnv && isRecyclerDevMode) {
      // SAFE DEVELOPMENT-ONLY OTP MODE:
      // Active ONLY when NODE_ENV=development AND RECYCLER_OTP_DEV_MODE=true.
      // 1. Logs OTP ONLY to backend terminal console.
      // 2. OTP is NEVER exposed in the HTTP API response.
      // 3. demoOtp is NEVER returned for Recycler.
      // 4. Stored in existing otpCache for validation by verifyOtp.
      console.log('\n============================================================');
      console.log('🟡 [DEVELOPMENT ONLY] RECYCLER AUTHENTICATION OTP');
      console.log(`📱 Recycler Mobile : +91-${cleanPhone}`);
      console.log(`🔑 Secure 6-Digit  : ${otp}`);
      console.log('⏳ Validity        : 5 Minutes (300s)');
      console.log('🛡️  Attempt Limit   : Maximum 5 Failed Attempts');
      console.log('⚠️  NOTICE          : Logged ONLY because NODE_ENV=development');
      console.log('                     AND RECYCLER_OTP_DEV_MODE=true.');
      console.log('                     In production, real cellular SMS is enforced.');
      console.log('============================================================\n');

      return res.json({
        success: true,
        message: `Verification code generated for +91-${cleanPhone}. Check backend development console for OTP.`,
        expiresInSeconds: 300,
        deliveryMode: 'DEV_CONSOLE',
        providerMessage: 'Development console OTP active (RECYCLER_OTP_DEV_MODE=true).'
      });
    }

    // In production or when dev mode is disabled: Fail honestly with HTTP 503
    return res.status(503).json({
      success: false,
      smsConfigured: false,
      deliveryMode: sendResult.deliveryMode,
      message: sendResult.providerMessage
    });
  }

  // Response:
  // For RECYCLER: NEVER expose demoOtp or the OTP in message!
  if (isRecycler) {
    return res.json({
      success: true,
      message: `OTP has been securely dispatched to +91-${cleanPhone} via SMS.`,
      expiresInSeconds: 300,
      deliveryMode: sendResult.deliveryMode,
      providerMessage: sendResult.providerMessage
    });
  }

  // For COLLECTOR (demo evaluation preserved):
  return res.json({
    success: true,
    message: `OTP generated for demonstration: ${otp}`,
    demoOtp: sendResult.demoOtp || otp,
    expiresInSeconds: 300,
    deliveryMode: sendResult.deliveryMode,
    providerMessage: sendResult.providerMessage,
    smsGatewayNotice: sendResult.dltComplianceNotice || 'Production SMS delivery requires TRAI DLT registration and commercial SMS gateway credentials (MSG91/Twilio). Operating in demonstration mode.'
  });
};

export const getSmsConfig = async (req: Request, res: Response) => {
  const isDevEnv = (process.env.NODE_ENV || 'development').toLowerCase() === 'development';
  const isRecyclerDevMode = process.env.RECYCLER_OTP_DEV_MODE === 'true';
  const isJudgeDemoEnabled = process.env.JUDGE_DEMO_ENABLED === 'true' && isDevEnv;

  return res.json({
    success: true,
    smsStatus: {
      ...smsService.getProviderStatus(),
      recyclerOtpDevMode: isDevEnv && isRecyclerDevMode,
      judgeDemoEnabled: isJudgeDemoEnabled,
      judgeDemoOtp: isJudgeDemoEnabled ? (process.env.JUDGE_DEMO_OTP || '123456') : undefined
    }
  });
};

const DEMO_PHONES: Record<UserRole, string> = {
  COLLECTOR: '9876543210',
  RECYCLER: '9820098200',
  ADMIN: '9999999999'
};
const ALL_DEMO_PHONES = Object.values(DEMO_PHONES);

export const verifyOtp = async (req: Request, res: Response) => {
  let { phone, otp, selectedRole, language = 'hi', name, district = 'Lucknow', state = 'Uttar Pradesh' } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: 'Phone and OTP are required.' });
  }

  let cleanPhone = phone.slice(-10);
  const cleanOtp = String(otp).trim();
  const cached = otpCache.get(cleanPhone);
  const isRecycler = selectedRole === 'RECYCLER' || cached?.role === 'RECYCLER';

  // SIH Judge Demo Evaluation Configuration:
  // Active ONLY when JUDGE_DEMO_ENABLED=true in non-production environments.
  const isJudgeDemoAllowed =
    process.env.JUDGE_DEMO_ENABLED === 'true' &&
    (process.env.NODE_ENV || 'development').toLowerCase() !== 'production' &&
    req.headers['x-test-simulate-production'] !== 'true';
  const configuredJudgeDemoOtp = (process.env.JUDGE_DEMO_OTP || '').trim();
  
  // Judge Demo OTP for Recycler is accepted ONLY for the designated Judge Demo phone (9820098200)
  const isJudgeDemoRecycler = cleanPhone === DEMO_PHONES.RECYCLER;
  const isJudgeDemoRecyclerOtp = Boolean(
    isJudgeDemoAllowed &&
    isJudgeDemoRecycler &&
    configuredJudgeDemoOtp &&
    cleanOtp === configuredJudgeDemoOtp
  );

  // For RECYCLER:
  // 1. Master OTP 1234 is STRICTLY FORBIDDEN under all circumstances.
  // 2. SIH Judge Demo OTP (from JUDGE_DEMO_OTP) is accepted ONLY for Judge Demo phone 9820098200 when JUDGE_DEMO_ENABLED=true in non-production.
  // 3. Otherwise, requires exact 6-digit cryptographically secure OTP matching cached session.
  if (isRecycler) {
    if (isJudgeDemoRecyclerOtp) {
      // Judge demo OTP matched for designated phone: allow authentication
      if (cached) {
        otpCache.delete(cleanPhone);
      }
    } else {
      if (!cached) {
        return res.status(400).json({
          success: false,
          message: 'No OTP request found for this mobile number or OTP has expired. Please request a new OTP.'
        });
      }

      if (cached.expiresAt < Date.now()) {
        otpCache.delete(cleanPhone);
        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please request a new verification code.'
        });
      }

      cached.attempts += 1;
      if (cached.attempts > cached.maxAttempts) {
        otpCache.delete(cleanPhone);
        return res.status(429).json({
          success: false,
          message: 'Maximum verification attempts exceeded. For security, this OTP has been invalidated. Please request a new OTP.'
        });
      }

      // Master OTP 1234 is strictly forbidden, and OTP must exactly match cached 6-digit code
      if (cleanOtp === '1234' || cached.otp !== cleanOtp) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP. Please enter the exact code received on your mobile number.'
        });
      }

      otpCache.delete(cleanPhone);
    }
  } else {
    // For Collector / Admin: Allow demo OTP 1234 for evaluation convenience
    const isDemoOtp = cleanOtp === '1234';
    const isValidOtp = (cached && cached.otp === cleanOtp && cached.expiresAt > Date.now()) || isDemoOtp;

    if (!isValidOtp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Use demo OTP 1234.' });
    }

    if (isDemoOtp && selectedRole) {
      if (ALL_DEMO_PHONES.includes(cleanPhone) || (selectedRole === 'ADMIN' && !['9999999999', '8888888888', '9876543299'].includes(cleanPhone))) {
        phone = DEMO_PHONES[selectedRole as UserRole];
        cleanPhone = phone.slice(-10);
      }
    }
  }

  let user = db.users.find(u => u.phone === cleanPhone);
  if (user && selectedRole && user.role !== selectedRole) {
    return res.status(403).json({
      success: false,
      message: `Role mismatch: This mobile number is registered as ${user.role}. Please select the ${user.role} portal to log in.`
    });
  }

  const ADMIN_PHONES = ['9999999999', '8888888888', '9876543299'];
  let assignedRole: UserRole = selectedRole || (cached?.role) || (user?.role) || 'COLLECTOR';
  if (assignedRole === 'ADMIN' && !ADMIN_PHONES.includes(cleanPhone) && user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized: Admin registration requires an authorized administrator credential.'
    });
  }

  const assignedLang: Language = language || (cached?.language) || (user?.language) || 'hi';

  // RECYCLER PROFILE & IDENTITY RESOLUTION
  if (assignedRole === 'RECYCLER') {
    // For the designated Judge Demo recycler (9820098200), guarantee explicit binding to rec_abc_1 and usr_recycler_abc
    if (cleanPhone === DEMO_PHONES.RECYCLER) {
      let abcRec = db.recyclers.find(r => r.id === 'rec_abc_1' || r.contactPhone === cleanPhone);
      if (abcRec) {
        abcRec.id = 'rec_abc_1';
        abcRec.userId = 'usr_recycler_abc';
        abcRec.facilityName = 'ABC E-Waste Recycling Pvt Ltd';
        abcRec.authorizationStatus = 'AUTHORIZED';
        abcRec.authorizationSource = 'PLATFORM_MANAGED';
        abcRec.contactPhone = cleanPhone;
      }
      if (!user) {
        user = db.users.find(u => u.id === 'usr_recycler_abc' || u.phone === cleanPhone);
      }
      if (!user) {
        user = {
          id: 'usr_recycler_abc',
          phone: cleanPhone,
          role: 'RECYCLER',
          language: assignedLang,
          name: 'ABC E-Waste Recycling Pvt Ltd',
          createdAt: new Date().toISOString()
        };
        db.users.push(user);
      } else {
        user.id = 'usr_recycler_abc';
        user.name = 'ABC E-Waste Recycling Pvt Ltd';
        user.role = 'RECYCLER';
      }
    }

    // Look up existing recycler in db.recyclers by phone or userId
    let existingRec = db.recyclers.find(
      r => r.contactPhone === cleanPhone || (r.userId && db.users.some(u => u.id === r.userId && u.phone === cleanPhone))
    );

    if (existingRec) {
      // Find or create matching user record with the authentic facilityName
      if (!user) {
        user = {
          id: existingRec.userId || `usr_recycler_${Date.now()}`,
          phone: cleanPhone,
          role: 'RECYCLER',
          language: assignedLang,
          name: existingRec.facilityName,
          createdAt: new Date().toISOString()
        };
        db.users.push(user);
      } else {
        // Ensure user name matches the registered facility name
        user.name = existingRec.facilityName;
      }
      existingRec.userId = user.id;
    } else {
      // If facility not found in database, do NOT invent fake registration numbers!
      // Assign truthful pending state
      if (!user) {
        user = {
          id: `usr_recycler_${Date.now()}`,
          phone: cleanPhone,
          role: 'RECYCLER',
          language: assignedLang,
          name: `Recycling Facility (${cleanPhone})`,
          createdAt: new Date().toISOString()
        };
        db.users.push(user);
      }

      existingRec = {
        id: `rec_${Date.now()}`,
        userId: user.id,
        facilityName: user.name,
        registrationNo: 'REGISTRATION_PENDING',
        authorizationStatus: 'PENDING_VERIFICATION',
        authorizationSource: 'PLATFORM_MANAGED',
        authValidUntil: '2026-12-31',
        contactPerson: `Representative (${cleanPhone})`,
        contactPhone: cleanPhone,
        district,
        state,
        address: `${district} Industrial Area`,
        latitude: 26.8467,
        longitude: 80.9462,
        acceptedMaterials: ['PCB', 'BATTERY', 'CABLE', 'MOTOR', 'CRT', 'LCD'],
        pickupAvailable: true,
        serviceRadiusKm: 30,
        baseOfferedRates: {
          PCB: 90,
          BATTERY: 105,
          CRT: 20,
          LCD: 45,
          CABLE: 70,
          MOTOR: 60,
          MAGNET: 50,
          MIXED_PLASTIC: 16
        },
        rating: 4.0,
        totalProcessedKg: 0,
        createdAt: new Date().toISOString()
      };
      db.recyclers.push(existingRec);
    }

    db.save();
  } else if (!user) {
    // Collector or Admin registration
    const defaultRoleName = assignedRole === 'COLLECTOR' ? 'Authorized Collector' : 'Regulatory Officer';
    const assignedName = name || cached?.name || defaultRoleName;

    user = {
      id: `usr_${Date.now()}`,
      phone: cleanPhone,
      role: assignedRole,
      language: assignedLang,
      name: assignedName,
      kycStatus: 'KYC_PENDING',
      createdAt: new Date().toISOString()
    };
    db.users.push(user);

    if (assignedRole === 'COLLECTOR') {
      const colProfile: CollectorProfile = {
        id: `col_${Date.now()}`,
        userId: user.id,
        name: assignedName,
        phone: cleanPhone,
        district,
        state,
        totalEarnings: 0,
        totalWeightCollected: 0,
        lotsCount: 0,
        preferredPaymentMethod: 'CASH',
        kycStatus: 'KYC_PENDING',
        createdAt: new Date().toISOString()
      };
      db.collectors.push(colProfile);
    }
    db.save();
  }

  // Generate Token
  const token = jwt.sign(
    {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  // Get specific profile
  const collectorProfile = db.collectors.find(c => c.userId === user?.id || c.phone === user?.phone);
  const recyclerProfile = db.recyclers.find(r => r.userId === user?.id || r.contactPhone === user?.phone);

  otpCache.delete(cleanPhone);

  return res.json({
    success: true,
    message: 'Authentication successful',
    token,
    user,
    collectorProfile,
    recyclerProfile
  });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const user = db.users.find(u => u.id === req.user?.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const collectorProfile = db.collectors.find(c => c.userId === user.id || c.phone === user.phone);
  const recyclerProfile = db.recyclers.find(r => r.userId === user.id || r.contactPhone === user.phone);

  return res.json({
    success: true,
    user,
    collectorProfile,
    recyclerProfile
  });
};

export const updateLanguage = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { language } = req.body;
  if (!['hi', 'mr', 'en'].includes(language)) {
    return res.status(400).json({ success: false, message: 'Supported languages: hi, mr, en' });
  }

  const user = db.users.find(u => u.id === req.user?.userId);
  if (user) {
    user.language = language as Language;
    db.save();
  }

  return res.json({ success: true, message: 'Language updated', language });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { name, district, state, preferredPaymentMethod, upiId } = req.body;
  const user = db.users.find(u => u.id === req.user?.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (name && typeof name === 'string' && name.trim().length > 0) {
    user.name = name.trim();
  }

  const colProfile = db.collectors.find(c => c.userId === user.id);
  if (colProfile) {
    if (name && typeof name === 'string' && name.trim().length > 0) {
      colProfile.name = name.trim();
    }
    if (district && typeof district === 'string') colProfile.district = district.trim();
    if (state && typeof state === 'string') colProfile.state = state.trim();
    if (preferredPaymentMethod && ['CASH', 'UPI', 'BANK_TRANSFER'].includes(preferredPaymentMethod)) {
      colProfile.preferredPaymentMethod = preferredPaymentMethod as any;
    }
    if (upiId !== undefined) {
      colProfile.upiId = String(upiId).trim();
    }
  }

  const recProfile = db.recyclers.find(r => r.userId === user.id);
  if (recProfile) {
    if (name && typeof name === 'string' && name.trim().length > 0) {
      recProfile.contactPerson = name.trim();
    }
    if (district && typeof district === 'string') recProfile.district = district.trim();
    if (state && typeof state === 'string') recProfile.state = state.trim();
  }

  db.save();

  return res.json({
    success: true,
    message: 'Profile updated successfully',
    user,
    collectorProfile: colProfile,
    recyclerProfile: recProfile
  });
};
