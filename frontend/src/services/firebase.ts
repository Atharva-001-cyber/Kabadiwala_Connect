import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyBxM5-ZyF9VLDYnbGB5fJDppk6BB-DdNmA",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "kabadiwala-connect-32d52.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "kabadiwala-connect-32d52",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "kabadiwala-connect-32d52.firebasestorage.app",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "670237101006",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:670237101006:web:b35b44e38ebf0f5c77799f",
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || "G-7KN1QT159E"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

let recaptchaVerifier: RecaptchaVerifier | null = null;

export const initRecaptcha = (containerId: string = 'recaptcha-container'): RecaptchaVerifier | null => {
  if (typeof window === 'undefined') return null;

  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`[FIREBASE] Recaptcha container '#${containerId}' not found in DOM`);
    return null;
  }

  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }

  try {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('⚡ [FIREBASE RECAPTCHA] Verified successfully');
      },
      'expired-callback': () => {
        console.warn('⚠️ [FIREBASE RECAPTCHA] Expired, resetting...');
        if (recaptchaVerifier) {
          recaptchaVerifier.render();
        }
      }
    });
  } catch (err) {
    console.warn('⚡ [FIREBASE RECAPTCHA] Pre-init note:', err);
  }

  return recaptchaVerifier;
};

export const sendRealSmsOtp = async (
  phone10Digit: string,
  containerId: string = 'recaptcha-container'
): Promise<{ success: boolean; confirmationResult?: ConfirmationResult; error?: string }> => {
  try {
    const cleanPhone = phone10Digit.trim().replace(/\D/g, '');
    const fullPhoneNumber = `+91${cleanPhone}`;

    let appVerifier = recaptchaVerifier;
    if (!appVerifier) {
      appVerifier = initRecaptcha(containerId);
    }
    if (!appVerifier) {
      throw new Error('Could not initialize reCAPTCHA verifier. Please check container ID.');
    }

    console.log(`📡 [FIREBASE AUTH] Sending real SMS OTP to ${fullPhoneNumber}...`);
    const confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
    console.log(`✅ [FIREBASE AUTH] SMS OTP dispatched successfully by Google to ${fullPhoneNumber}`);

    return {
      success: true,
      confirmationResult
    };
  } catch (error: any) {
    console.error('❌ [FIREBASE AUTH] sendRealSmsOtp error:', error);
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch {
        // ignore
      }
      recaptchaVerifier = null;
    }
    let userMsg = error.message || 'Failed to dispatch real SMS OTP';
    if (userMsg.includes('region enabled by the app developer') || userMsg.includes('SMS unable to be sent')) {
      userMsg = 'Firebase SMS Region Policy: Please enable India (+91) in Firebase Console > Authentication > Settings > SMS Region Policy.';
    } else if (userMsg.includes('auth/unauthorized-domain')) {
      userMsg = 'Firebase Unauthorized Domain: Please add localhost to Firebase Console > Authentication > Settings > Authorized domains.';
    }
    return {
      success: false,
      error: userMsg
    };
  }
};

export const signInWithGoogle = async (): Promise<{
  success: boolean;
  user?: FirebaseUser;
  error?: string;
}> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    return {
      success: true,
      user: result.user
    };
  } catch (error: any) {
    console.error('❌ [FIREBASE GOOGLE AUTH] Error:', error);
    let userMsg = error.message || 'Google Sign-in failed';
    if (userMsg.includes('auth/popup-closed-by-user')) {
      userMsg = 'Google Sign-in was cancelled (popup closed).';
    } else if (userMsg.includes('auth/unauthorized-domain')) {
      userMsg = 'Domain not authorized: Please add localhost to Firebase Console > Authentication > Settings > Authorized domains.';
    } else if (userMsg.includes('auth/operation-not-allowed')) {
      userMsg = 'Google Provider not enabled: Please enable Google in Firebase Console > Authentication > Sign-in method.';
    }
    return {
      success: false,
      error: userMsg
    };
  }
};

