/**
 * Fast2SMS Real Carrier SMS Gateway Integration for India (+91)
 * API Documentation: https://docs.fast2sms.com/
 */

export interface Fast2SmsResult {
  success: boolean;
  message?: string;
  error?: string;
}

export const sendFast2SmsOtp = async (
  phone10Digit: string,
  otpCode: string
): Promise<Fast2SmsResult> => {
  const apiKey = (import.meta as any).env?.VITE_FAST2SMS_API_KEY || '';

  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_FAST2SMS_API_KEY') {
    return {
      success: false,
      error: 'VITE_FAST2SMS_API_KEY missing in .env.local file'
    };
  }

  const cleanPhone = phone10Digit.trim().replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    return {
      success: false,
      error: 'Invalid 10-digit mobile number format'
    };
  }

  const targetUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost')
    ? '/fast2sms-api/bulkV2'
    : 'https://www.fast2sms.com/dev/bulkV2';

  // 1. Try OTP Route (route=otp)
  try {
    console.log(`📡 [FAST2SMS OTP ROUTE] Dispatching SMS OTP (${otpCode}) to +91 ${cleanPhone}...`);

    const otpUrl = `${targetUrl}?authorization=${encodeURIComponent(apiKey.trim())}&route=otp&variables_values=${encodeURIComponent(otpCode)}&numbers=${encodeURIComponent(cleanPhone)}`;

    const response = await fetch(otpUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const data = await response.json();
    console.log('📬 [FAST2SMS OTP ROUTE RESPONSE]:', data);

    if (data.return === true || data.status_code === 200 || (Array.isArray(data.message) && data.message[0]?.toLowerCase().includes('sent'))) {
      return {
        success: true,
        message: `Real Carrier SMS sent to +91 ${cleanPhone}!`
      };
    }

    // 2. If Fast2SMS returns status 996 (Website Verification Needed), automatically fallback to Quick SMS Route (route=q)
    if (data.status_code === 996 || (Array.isArray(data.message) && data.message[0]?.toLowerCase().includes('verification'))) {
      console.warn('⚡ [FAST2SMS] OTP Route requires website verification (Code 996). Retrying via Quick SMS Route (route=q)...');

      const qMsg = `Your Kabadiwala Connect verification OTP code is ${otpCode}. Valid for 5 mins.`;
      const quickUrl = `${targetUrl}?authorization=${encodeURIComponent(apiKey.trim())}&route=q&message=${encodeURIComponent(qMsg)}&language=english&flash=0&numbers=${encodeURIComponent(cleanPhone)}`;

      const qResponse = await fetch(quickUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      const qData = await qResponse.json();
      console.log('📬 [FAST2SMS QUICK ROUTE RESPONSE]:', qData);

      if (qData.return === true || qData.status_code === 200 || (Array.isArray(qData.message) && qData.message[0]?.toLowerCase().includes('sent'))) {
        return {
          success: true,
          message: `Real Carrier SMS sent to +91 ${cleanPhone} via Quick Route!`
        };
      } else {
        const qErrMsg = Array.isArray(qData.message) ? qData.message.join(', ') : (qData.message || 'Fast2SMS Quick Route dispatch failed');
        return {
          success: false,
          error: qErrMsg
        };
      }
    }

    const errMsg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Fast2SMS dispatch failed');
    return {
      success: false,
      error: errMsg
    };
  } catch (err: any) {
    console.error('❌ [FAST2SMS ERROR]:', err);
    return {
      success: false,
      error: err.message || 'Network error connecting to Fast2SMS API'
    };
  }
};
