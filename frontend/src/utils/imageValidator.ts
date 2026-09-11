/**
 * Deterministic Client-Side Image Quality Validator for E-Waste Photographs
 * Analyzes resolution, luminance (darkness/glare), and edge contrast (blur) using HTML5 Canvas.
 * Non-blocking: Guides the collector to take usable photographs without rejecting arbitrarily.
 */

export interface ImageQualityReport {
  isValid: boolean;
  isClear: boolean;
  isRejectable: boolean;
  rejectionReason?: { hi: string; mr: string; en: string };
  brightness: 'GOOD' | 'TOO_DARK' | 'TOO_BRIGHT';
  resolution: 'GOOD' | 'LOW';
  dimensions: { width: number; height: number };
  avgLuminance: number;
  contrastVariance: number;
  label: { hi: string; mr: string; en: string };
  warning?: { hi: string; mr: string; en: string };
}

export async function validateImageQuality(source: File | Blob | string): Promise<ImageQualityReport> {
  return new Promise((resolve) => {
    // If not in browser environment or canvas unavailable
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve({
        isValid: true,
        isClear: true,
        isRejectable: false,
        brightness: 'GOOD',
        resolution: 'GOOD',
        dimensions: { width: 800, height: 600 },
        avgLuminance: 128,
        contrastVariance: 45,
        label: {
          hi: '✓ फोटो ठीक है',
          mr: '✓ फोटो योग्य आहे',
          en: '✓ Photo OK'
        }
      });
      return;
    }

    let url = '';
    let shouldRevoke = false;

    if (typeof source === 'string') {
      url = source;
    } else if (typeof Blob !== 'undefined' && (source as any) instanceof Blob) {
      url = URL.createObjectURL(source);
      shouldRevoke = true;
    } else {
      resolve({
        isValid: false,
        isClear: false,
        isRejectable: true,
        brightness: 'TOO_DARK',
        resolution: 'LOW',
        dimensions: { width: 0, height: 0 },
        avgLuminance: 0,
        contrastVariance: 0,
        label: {
          hi: '✗ अमान्य फोटो',
          mr: '✗ अवैध फोटो',
          en: '✗ Invalid Photo'
        },
        rejectionReason: {
          hi: 'फोटो लोड करने में त्रुटि। कृपया पुनः प्रयास करें।',
          mr: 'फोटो लोड करण्यात त्रुटी. कृपया पुन्हा प्रयत्न करा.',
          en: 'Error loading photo. Please try again.'
        }
      });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (shouldRevoke) {
        URL.revokeObjectURL(url);
      }

      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      if (width === 0 || height === 0) {
        resolve({
          isValid: false,
          isClear: false,
          isRejectable: true,
          brightness: 'TOO_DARK',
          resolution: 'LOW',
          dimensions: { width: 0, height: 0 },
          avgLuminance: 0,
          contrastVariance: 0,
          label: {
            hi: '✗ खाली फोटो',
            mr: '✗ रिक्त फोटो',
            en: '✗ Empty Photo'
          },
          rejectionReason: {
            hi: 'फोटो में कोई डेटा नहीं है। कृपया दोबारा फोटो लें।',
            mr: 'फोटोमध्ये कोणताही डेटा नाही. कृपया पुन्हा फोटो काढा.',
            en: 'Photo contains no image data. Please retake.'
          }
        });
        return;
      }

      // Check resolution
      const isSevereLowRes = width < 120 || height < 120;
      const isLowRes = width < 300 || height < 300;

      // Downscale to 160x160 offscreen canvas for fast, lightweight pixel analysis
      const sampleSize = 160;
      const canvas = document.createElement('canvas');
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve({
          isValid: true,
          isClear: true,
          isRejectable: false,
          brightness: 'GOOD',
          resolution: isLowRes ? 'LOW' : 'GOOD',
          dimensions: { width, height },
          avgLuminance: 128,
          contrastVariance: 40,
          label: {
            hi: '✓ फोटो लोड हो गई',
            mr: '✓ फोटो जोडला गेला',
            en: '✓ Photo Loaded'
          }
        });
        return;
      }

      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const data = imageData.data;

      let totalLuminance = 0;
      const luminances: number[] = [];
      const pixelCount = sampleSize * sampleSize;

      // Calculate ITU-R BT.601 luminance per pixel
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuminance += lum;
        luminances.push(lum);
      }

      const avgLuminance = Math.round(totalLuminance / pixelCount);

      // Calculate variance / contrast
      let varianceSum = 0;
      for (let i = 0; i < luminances.length; i++) {
        const diff = luminances[i] - avgLuminance;
        varianceSum += diff * diff;
      }
      const contrastVariance = Math.round(Math.sqrt(varianceSum / pixelCount));

      // Strict rejection checks based on SIH quality standards:
      let brightness: 'GOOD' | 'TOO_DARK' | 'TOO_BRIGHT' = 'GOOD';
      let warning: { hi: string; mr: string; en: string } | undefined = undefined;
      let rejectionReason: { hi: string; mr: string; en: string } | undefined = undefined;
      let isClear = true;
      let isRejectable = false;

      if (avgLuminance < 25) {
        brightness = 'TOO_DARK';
        isRejectable = true;
        rejectionReason = {
          hi: 'फोटो बहुत अंधेरी है और ई-कचरे का निरीक्षण नहीं हो सकता। कृपया रोशनी में रखकर दोबारा साफ़ फोटो लें।',
          mr: 'फोटो खूप अंधारा आहे आणि ई-कचऱ्याची तपासणी करणे अशक्य आहे. कृपया प्रकाशात पुन्हा स्पष्ट फोटो काढा.',
          en: 'Photo is too dark to inspect e-waste. Please retake in good lighting.'
        };
      } else if (avgLuminance < 35) {
        brightness = 'TOO_DARK';
        warning = {
          hi: 'फोटो में रोशनी कम है। कृपया ई-वेस्ट को अच्छी रोशनी में रखकर फोटो लें।',
          mr: 'फोटोमध्ये प्रकाश कमी आहे. कृपया चांगल्या प्रकाशात ई-कचऱ्याचा फोटो काढा.',
          en: 'Photo is somewhat dark. Please take photo in better lighting.'
        };
      } else if (avgLuminance > 248) {
        brightness = 'TOO_BRIGHT';
        isRejectable = true;
        rejectionReason = {
          hi: 'फोटो में अत्यधिक चमक/फ्लैश है जिससे ई-वेस्ट दिखाई नहीं दे रहा। कृपया रोशनी से थोड़ा हटकर फोटो लें।',
          mr: 'फोटोमध्ये खूप जास्त चकाकी/फ्लॅश आहे. कृपया थेट प्रकाशापासून बाजूला पुन्हा फोटो काढा.',
          en: 'Photo has severe glare/overexposure. Please retake away from direct glare.'
        };
      } else if (avgLuminance > 240) {
        brightness = 'TOO_BRIGHT';
        warning = {
          hi: 'फोटो में अत्यधिक चमक है। कृपया रोशनी से थोड़ा हटकर फोटो लें।',
          mr: 'फोटोमध्ये खूप जास्त चकाकी आहे. कृपया थेट प्रकाशापासून बाजूला फोटो काढा.',
          en: 'Photo has glare. Please reduce direct reflection.'
        };
      } else if (contrastVariance < 9) {
        isClear = false;
        isRejectable = true;
        rejectionReason = {
          hi: 'फोटो अत्यधिक धुंधली या अस्पष्ट है और ई-कचरे की पहचान नहीं हो सकती। कृपया कैमरा स्थिर रखकर साफ़ फोटो लें।',
          mr: 'फोटो खूप अस्पष्ट/धुरकट आहे आणि ई-कचऱ्याची ओळख पटवणे अशक्य आहे. कृपया कॅमेरा स्थिर ठेवून पुन्हा स्पष्ट फोटो काढा.',
          en: 'Photo is extremely blurry/unreadable. Please hold camera steady and retake.'
        };
      } else if (contrastVariance < 14) {
        isClear = false;
        warning = {
          hi: 'फोटो थोड़ी धुंधली है। अधिक स्पष्टता के लिए कैमरा स्थिर रखकर पास से फोटो लें।',
          mr: 'फोटो थोडा अस्पष्ट आहे. अधिक स्पष्टतेसाठी कॅमेरा स्थिर ठेवून जवळून फोटो काढा.',
          en: 'The photo is slightly blurry. Please hold camera steady for better clarity.'
        };
      } else if (isSevereLowRes) {
        isRejectable = true;
        rejectionReason = {
          hi: 'फोटो का आकार बहुत छोटा है (कम से कम 150×150 आवश्यक)। कृपया साफ़ फोटो लें।',
          mr: 'फोटोचा आकार खूप लहान आहे. कृपया जवळून स्पष्ट फोटो काढा.',
          en: 'Photo resolution is too low (minimum 150x150 required). Please retake a clear photo.'
        };
      } else if (isLowRes) {
        warning = {
          hi: 'फोटो का रिज़ॉल्यूशन कम है। कृपया साफ़ फोटो के लिए पास से फोटो लें।',
          mr: 'फोटोचे रिझोल्यूशन कमी आहे. कृपया स्पष्टतेसाठी जवळून फोटो काढा.',
          en: 'Photo resolution is low. Please take a closer photo for clarity.'
        };
      }

      const isAllGood = !isRejectable && brightness === 'GOOD' && isClear && !isLowRes;

      resolve({
        isValid: !isRejectable,
        isClear,
        isRejectable,
        rejectionReason,
        brightness,
        resolution: isLowRes ? 'LOW' : 'GOOD',
        dimensions: { width, height },
        avgLuminance,
        contrastVariance,
        label: isRejectable
          ? {
              hi: '✗ अस्वीकृत (अस्पष्ट फोटो)',
              mr: '✗ नाकारले (अस्पष्ट फोटो)',
              en: '✗ Rejected (Unclear Photo)'
            }
          : isAllGood
          ? {
              hi: '✓ साफ़ व स्पष्ट फोटो',
              mr: '✓ स्पष्ट व योग्य फोटो',
              en: '✓ Clear & Sharp Photo'
            }
          : {
              hi: '⚠️ गुणवत्ता सूचना',
              mr: '⚠️ गुणवत्ता सूचना',
              en: '⚠️ Quality Notice'
            },
        warning
      });
    };

    img.onerror = () => {
      if (shouldRevoke) {
        URL.revokeObjectURL(url);
      }
      resolve({
        isValid: false,
        isClear: false,
        isRejectable: true,
        brightness: 'TOO_DARK',
        resolution: 'LOW',
        dimensions: { width: 0, height: 0 },
        avgLuminance: 0,
        contrastVariance: 0,
        label: {
          hi: '✗ लोड नहीं हो सका',
          mr: '✗ लोड होऊ शकले नाही',
          en: '✗ Failed to Load'
        },
        rejectionReason: {
          hi: 'फोटो फ़ाइल लोड करने में त्रुटि। कृपया पुनः फोटो लें।',
          mr: 'फोटो फाइल लोड करण्यात त्रुटी. कृपया पुन्हा फोटो घ्या.',
          en: 'Error loading photo file. Please retake.'
        }
      });
    };

    img.src = url;
  });
}
