import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, AlertCircle, SwitchCamera, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

// Robust mobile/tablet detection helper
const detectIsMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  return isMobileUA || (hasTouch && window.innerWidth < 1024);
};

// Filter out known Windows Hello Infrared (IR) and Depth sensors that output black frames
const isIrOrDepthCamera = (label: string): boolean => {
  const lower = label.toLowerCase();
  return (
    lower.includes('ir ') ||
    lower.includes(' ir') ||
    lower.includes('infrared') ||
    lower.includes('windows hello') ||
    lower.includes('depth') ||
    lower.includes('face auth') ||
    lower.includes('biometric') ||
    lower.includes('realcontent')
  );
};

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture
}) => {
  const { language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Desktop/laptop prefers 'user' (webcam) to prevent Windows Hello IR camera black-screen.
  // Mobile/tablet prefers 'environment' (rear camera).
  const [isMobile] = useState<boolean>(() => detectIsMobileDevice());
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(() => (
    detectIsMobileDevice() ? 'environment' : 'user'
  ));

  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isFeedReady, setIsFeedReady] = useState(false);

  // Stop any active camera media stream
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping camera track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsFeedReady(false);
  };

  // Wait until the video element receives valid non-zero dimensions
  const waitForValidDimensions = (video: HTMLVideoElement, timeoutMs = 4500): Promise<boolean> => {
    return new Promise((resolve) => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        resolve(true);
        return;
      }
      let timer: ReturnType<typeof setTimeout> | null = null;
      const onReady = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          cleanup();
          resolve(true);
        }
      };
      const cleanup = () => {
        video.removeEventListener('loadedmetadata', onReady);
        video.removeEventListener('canplay', onReady);
        video.removeEventListener('playing', onReady);
        video.removeEventListener('resize', onReady);
        if (timer) clearTimeout(timer);
      };
      video.addEventListener('loadedmetadata', onReady);
      video.addEventListener('canplay', onReady);
      video.addEventListener('playing', onReady);
      video.addEventListener('resize', onReady);

      timer = setTimeout(() => {
        cleanup();
        resolve(video.videoWidth > 0 && video.videoHeight > 0);
      }, timeoutMs);
    });
  };

  // Start hardware camera stream
  const startCamera = async (mode: 'environment' | 'user', specificDeviceId?: string | null) => {
    stopCameraStream();
    setCameraError(null);
    setIsLoading(true);
    setIsFeedReady(false);

    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsLoading(false);
      setCameraError(
        language === 'hi'
          ? 'इस ब्राउज़र में लाइव कैमरा समर्थित नहीं है। कृपया नीचे दिए गए बटन से डिवाइस कैमरा खोलें।'
          : language === 'mr'
          ? 'या ब्राउझरमध्ये थेट कॅमेरा समर्थित नाही. कृपया खालील बटणाने डिव्हाइस कॅमेरा उघडा.'
          : 'Live camera is not supported in this browser. Please use the device camera option below.'
      );
      return;
    }

    try {
      let stream: MediaStream;

      // 1. Enumerate devices if possible to discover usable RGB cameras and avoid IR sensors
      let chosenDeviceId = specificDeviceId || null;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        const rgbInputs = videoInputs.filter((d) => !isIrOrDepthCamera(d.label));
        const usableInputs = rgbInputs.length > 0 ? rgbInputs : videoInputs;

        setAvailableCameras(usableInputs);
        setHasMultipleCameras(usableInputs.length > 1);

        if (!chosenDeviceId && usableInputs.length > 0 && usableInputs[0].deviceId) {
          // If on desktop and we found named devices, pick the first non-IR camera
          if (!isMobile && rgbInputs.length > 0) {
            chosenDeviceId = rgbInputs[0].deviceId;
          }
        }
      } catch (enumErr) {
        console.warn('Device enumeration before getUserMedia:', enumErr);
      }

      try {
        if (chosenDeviceId) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: chosenDeviceId },
              width: { ideal: 1920, min: 640 },
              height: { ideal: 1080, min: 480 }
            },
            audio: false
          });
          setActiveCameraId(chosenDeviceId);
        } else {
          // Attempt preferred environment (rear on mobile) or user (front/webcam on desktop)
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: mode },
              width: { ideal: 1920, min: 640 },
              height: { ideal: 1080, min: 480 }
            },
            audio: false
          });
        }
      } catch (constraintErr) {
        console.warn('Ideal camera constraint failed, trying generic video constraint:', constraintErr);
        // Fallback to generic video if exact constraint fails on some hardware
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;

      // Re-enumerate after permission granted (now labels are populated)
      try {
        const refreshedDevices = await navigator.mediaDevices.enumerateDevices();
        const vInputs = refreshedDevices.filter((d) => d.kind === 'videoinput');
        const nonIrInputs = vInputs.filter((d) => !isIrOrDepthCamera(d.label));
        const finalUsable = nonIrInputs.length > 0 ? nonIrInputs : vInputs;
        setAvailableCameras(finalUsable);
        setHasMultipleCameras(finalUsable.length > 1);
      } catch {
        // ignore
      }

      if (videoRef.current) {
        // Explicitly set video.muted = true on the DOM node to satisfy Autoplay Policies reliably
        videoRef.current.muted = true;
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('video.play() caught exception:', playErr);
        }

        // A3: Require videoWidth > 0 and videoHeight > 0 before considering preview ready
        const hasValidDimensions = await waitForValidDimensions(videoRef.current, 4500);

        if (hasValidDimensions && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
          setIsFeedReady(true);
          setIsLoading(false);
        } else {
          // A4: Black frame / 0-dimension detection
          console.warn('Camera stream is active but video dimensions remained 0x0 (potential IR sensor or closed shutter).');
          setIsFeedReady(false);
          setIsLoading(false);
          setCameraError(
            language === 'hi'
              ? 'कैमरा पूर्वावलोकन उपलब्ध नहीं है। कृपया कैमरा बदलें, शटर खोलें या नीचे दिए गए डिवाइस कैमरा विकल्प का उपयोग करें।'
              : language === 'mr'
              ? 'कॅमेरा पूर्वावलोकन उपलब्ध नाही. कृपया कॅमेरा बदला किंवा खालील डिव्हाइस कॅमेरा पर्याय वापरा.'
              : 'Camera preview is unavailable or showing a black screen. Please switch camera, open the shutter, or use the device camera below.'
          );
        }
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setIsLoading(false);
      setIsFeedReady(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          language === 'hi'
            ? 'कैमरा अनुमति अस्वीकृत है। कृपया ब्राउज़र सेटिंग्स में कैमरा अनुमति दें।'
            : language === 'mr'
            ? 'कॅमेरा परवानगी नाकारली आहे. कृपया ब्राउझर सेटिंग्जमध्ये कॅमेरा परवानगी द्या.'
            : 'Camera permission was denied. Please grant camera permission in your browser settings.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError(
          language === 'hi'
            ? 'डिवाइस पर कोई कैमरा नहीं मिला। कृपया गैलरी का उपयोग करें।'
            : language === 'mr'
            ? 'डिव्हाइसवर कॅमेरा सापडला नाही. कृपया गॅलरी वापरा.'
            : 'No camera found on this device. Please use the gallery option.'
        );
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError(
          language === 'hi'
            ? 'कैमरा किसी अन्य ऐप द्वारा उपयोग में है। कृपया पुनः प्रयास करें।'
            : language === 'mr'
            ? 'कॅमेरा इतर अॅपद्वारे वापरला जात आहे. कृपया पुन्हा प्रयत्न करा.'
            : 'Camera is currently in use by another application. Please close it and retry.'
        );
      } else {
        setCameraError(
          language === 'hi'
            ? 'कैमरा प्रारंभ करने में त्रुटि हुई। कृपया पुनः प्रयास करें।'
            : language === 'mr'
            ? 'कॅमेरा सुरू करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.'
            : 'Failed to access camera. Please try again or use the gallery.'
        );
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode, activeCameraId);
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen]);

  // Capture current video frame to high-resolution JPEG File
  const handleCaptureSnapshot = () => {
    if (!videoRef.current || isCapturing) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D context unavailable');
      }

      // Draw active video frame
      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          setIsCapturing(false);
          if (blob) {
            const capturedFile = new File(
              [blob],
              `collector-scrap-${Date.now()}.jpg`,
              { type: 'image/jpeg', lastModified: Date.now() }
            );
            stopCameraStream();
            onCapture(capturedFile);
            onClose();
          } else {
            console.error('Failed to create image blob from camera capture');
          }
        },
        'image/jpeg',
        0.92
      );
    } catch (e) {
      console.error('Snapshot capture error:', e);
      setIsCapturing(false);
    }
  };

  // Toggle between environment (rear) and user (front) facing camera, or cycle usable cameras
  const handleToggleFacingMode = () => {
    if (availableCameras.length > 1) {
      const currentIndex = availableCameras.findIndex((c) => c.deviceId === activeCameraId);
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      const nextDevice = availableCameras[nextIndex];
      setActiveCameraId(nextDevice.deviceId);
      const nextMode = facingMode === 'environment' ? 'user' : 'environment';
      setFacingMode(nextMode);
      startCamera(nextMode, nextDevice.deviceId);
    } else {
      const nextMode = facingMode === 'environment' ? 'user' : 'environment';
      setFacingMode(nextMode);
      startCamera(nextMode, null);
    }
  };

  // Fallback file capture for environments where live getUserMedia is unavailable or black
  const handleFallbackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCameraStream();
      onCapture(file);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Context-aware camera mode label (A1 & A9)
  const getCameraLabel = () => {
    if (!isMobile) {
      return language === 'hi' ? '● वेबकैम / कैमरा' : language === 'mr' ? '● वेबकॅम / कॅमेरा' : '● Integrated Webcam';
    }
    if (facingMode === 'environment') {
      return language === 'hi' ? '● बैक (रियर) कैमरा' : language === 'mr' ? '● मागील कॅमेरा' : '● Rear Camera';
    }
    return language === 'hi' ? '● फ्रंट कैमरा' : language === 'mr' ? '● पुढील कॅमेरा' : '● Front Camera';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 select-none animate-fadeIn">
      {/* Top Bar: Title, Camera Mode Indicator & Controls */}
      <div className="flex items-center justify-between text-white z-10 w-full max-w-xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-md">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base">
              {language === 'hi' ? 'कबाड़ की फोटो लें' : language === 'mr' ? 'भंगाराचा फोटो घ्या' : 'Take Scrap Photo'}
            </h3>
            <span className="text-[11px] text-emerald-400 font-semibold tracking-wide">
              {getCameraLabel()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasMultipleCameras && (
            <button
              type="button"
              onClick={handleToggleFacingMode}
              className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 active:scale-95 transition-all shadow"
              title={language === 'hi' ? 'कैमरा बदलें' : language === 'mr' ? 'कॅमेरा बदला' : 'Switch Camera'}
              aria-label="Switch Camera"
            >
              <SwitchCamera className="w-4 h-4 text-emerald-300" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition-all shadow"
            title={language === 'hi' ? 'बंद करें' : language === 'mr' ? 'बंद करा' : 'Close'}
            aria-label="Close Camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Viewfinder Box */}
      <div className="flex-1 my-3 flex items-center justify-center relative w-full max-w-xl mx-auto overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-slate-950 shadow-2xl">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-emerald-400 z-20 space-y-2 p-4 text-center">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <span className="text-xs font-bold text-slate-300">
              {language === 'hi' ? 'कैमरा शुरू हो रहा है...' : language === 'mr' ? 'कॅमेरा सुरू होत आहे...' : 'Starting camera...'}
            </span>
            <span className="text-[10px] text-slate-500">
              {language === 'hi' ? 'कृपया थोड़ा प्रतीक्षा करें' : language === 'mr' ? 'कृपया थोडा वेळ थांबा' : 'Verifying camera feed...'}
            </span>
          </div>
        )}

        {/* Live Camera Video Feed (muted prop + DOM muted = true) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isFeedReady && !cameraError ? 'opacity-100 block' : 'opacity-0 hidden'
          }`}
        />

        {/* Camera Alignment Target Crosshairs Overlay */}
        {!cameraError && isFeedReady && !isLoading && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
            <div className="flex justify-between">
              <div className="w-8 h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl-xl" />
              <div className="w-8 h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr-xl" />
            </div>
            <div className="text-center">
              <span className="px-3 py-1 rounded-full bg-slate-950/70 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold backdrop-blur-sm">
                {language === 'hi' ? 'स्क्रैप को फ्रेम के बीच में रखें' : language === 'mr' ? 'स्क्रॅप फ्रेमच्या मध्यभागी ठेवा' : 'Center scrap item inside frame'}
              </span>
            </div>
            <div className="flex justify-between">
              <div className="w-8 h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl-xl" />
              <div className="w-8 h-8 border-b-2 border-r-2 border-emerald-400 rounded-br-xl" />
            </div>
          </div>
        )}

        {/* Error / Problem State UI */}
        {cameraError && (
          <div className="p-6 text-center space-y-4 max-w-sm z-10 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 mx-auto shadow-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-xs text-red-200 font-medium leading-relaxed">
              {cameraError}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => startCamera(facingMode, activeCameraId)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'फिर कोशिश करें' : language === 'mr' ? 'पुन्हा प्रयत्न करा' : 'Retry Camera'}</span>
              </button>

              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-bold text-xs shadow flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <SwitchCamera className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'कैमरा बदलें' : language === 'mr' ? 'कॅमेरा बदला' : 'Switch Camera'}</span>
                </button>
              )}

              {/* Native Device Camera App Fallback Button */}
              <button
                type="button"
                onClick={() => fallbackInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-bold text-xs shadow flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'डिवाइस कैमरा इस्तेमाल करें' : language === 'mr' ? 'डिव्हाइस कॅमेरा वापरा' : 'Use Device Camera'}</span>
              </button>

              {/* Gallery Fallback Button */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs shadow flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'गैलरी से चुनें' : language === 'mr' ? 'गॅलरीमधून निवडा' : 'Choose from Gallery'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* A5: Always-Accessible Quick Fallback Toolbar (Never trapped inside cameraError) */}
      <div className="flex items-center justify-center gap-2 py-1.5 px-3 max-w-xl mx-auto w-full z-10">
        <button
          type="button"
          onClick={() => fallbackInputRef.current?.click()}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
          title={language === 'hi' ? 'डिवाइस कैमरा ऐप खोलें' : language === 'mr' ? 'डिव्हाइस कॅमेरा उघडा' : 'Use Device Camera'}
        >
          <Camera className="w-3.5 h-3.5 text-emerald-400" />
          <span>{language === 'hi' ? 'डिवाइस कैमरा इस्तेमाल करें' : language === 'mr' ? 'डिव्हाइस कॅमेरा वापरा' : 'Use Device Camera'}</span>
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
          title={language === 'hi' ? 'गैलरी से फोटो चुनें' : language === 'mr' ? 'गॅलरीमधून निवडा' : 'Choose from Gallery'}
        >
          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>{language === 'hi' ? 'गैलरी से चुनें' : language === 'mr' ? 'गॅलरीमधून निवडा' : 'Choose from Gallery'}</span>
        </button>

        {/* Hidden Fallback Inputs */}
        <input
          ref={fallbackInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFallbackFileChange}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFallbackFileChange}
          className="hidden"
        />
      </div>

      {/* Bottom Shutter / Action Controls */}
      <div className="flex items-center justify-around w-full max-w-xl mx-auto py-2 z-10">
        <button
          type="button"
          onClick={() => {
            stopCameraStream();
            onClose();
          }}
          className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 active:scale-95 transition-all"
        >
          {language === 'hi' ? 'रद्द करें' : language === 'mr' ? 'रद्द करा' : 'Cancel'}
        </button>

        {/* Big Shutter Button */}
        <button
          type="button"
          onClick={handleCaptureSnapshot}
          disabled={isLoading || Boolean(cameraError) || isCapturing || !isFeedReady}
          className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 border-emerald-400 p-1 bg-white hover:bg-slate-200 active:scale-90 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-2xl shadow-emerald-500/40 flex items-center justify-center"
          title={language === 'hi' ? 'फोटो खींचें' : language === 'mr' ? 'फोटो काढा' : 'Capture Photo'}
          aria-label="Capture Photo"
        >
          <div className="w-full h-full rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-inner">
            <Camera className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
        </button>

        <div className="w-16 sm:w-20 flex justify-end">
          {hasMultipleCameras && (
            <button
              type="button"
              onClick={handleToggleFacingMode}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 active:scale-95 transition-all"
              title={language === 'hi' ? 'कैमरा बदलें' : language === 'mr' ? 'कॅमेरा बदला' : 'Switch Camera'}
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
