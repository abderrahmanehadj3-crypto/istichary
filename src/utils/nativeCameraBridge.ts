/**
 * Native Camera & Media Bridge for Android WebView / Cordova / Capacitor / Median / Web
 * 
 * Solves WebView camera permission failures ("تعذر الوصول إلى الكاميرا") by:
 * 1. Attempting WebRTC navigator.mediaDevices.getUserMedia with mobile facingMode
 * 2. Detecting Capacitor / Cordova / Median plugins if available in wrapper
 * 3. Gracefully falling back to OS Native Camera Intent via `<input capture="user">`
 */

export interface CameraCaptureResult {
  dataUrl: string;
  source: 'webrtc' | 'native_plugin' | 'native_intent';
}

/**
 * Check if running inside a mobile WebView / wrapper
 */
export function isMobileWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isCapacitor = !!(window as any).Capacitor;
  const isCordova = !!(window as any).cordova || !!(window as any).PhoneGap;
  const isMedian = !!(window as any).median || !!(window as any).gonative;
  const isAndroidWebView = /wv|android.*version\/[0-9.]+/i.test(userAgent);
  const isIOSWebView = /(iphone|ipod|ipad).*applewebkit(?!.*safari)/i.test(userAgent);

  return isCapacitor || isCordova || isMedian || isAndroidWebView || isIOSWebView;
}

/**
 * Request camera permission and start video stream
 */
export async function startNativeCameraStream(
  videoElement: HTMLVideoElement,
  facingMode: 'user' | 'environment' = 'user'
): Promise<MediaStream> {
  // Check if getUserMedia is available
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('WEBVIEW_NO_WEBRTC');
  }

  // Mobile-optimized constraints
  const constraints: MediaStreamConstraints = {
    audio: false,
    video: {
      facingMode: { ideal: facingMode },
      width: { ideal: facingMode === 'user' ? 640 : 1280 },
      height: { ideal: facingMode === 'user' ? 640 : 720 },
    },
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;
    videoElement.setAttribute('playsinline', 'true');
    videoElement.setAttribute('webkit-playsinline', 'true');
    await videoElement.play();
    return stream;
  } catch (error: any) {
    console.warn('[CameraBridge] getUserMedia failed, attempting fallback constraints:', error);
    
    // Try basic fallback constraints if specific facingMode was rejected
    try {
      const basicStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      });
      videoElement.srcObject = basicStream;
      videoElement.setAttribute('playsinline', 'true');
      videoElement.setAttribute('webkit-playsinline', 'true');
      await videoElement.play();
      return basicStream;
    } catch (fallbackError: any) {
      console.error('[CameraBridge] Camera access fully blocked in WebView:', fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Capture frame from active video element to Base64 JPEG
 */
export function captureFrameFromVideo(
  videoElement: HTMLVideoElement,
  quality: number = 0.9,
  facingMode: 'user' | 'environment' = 'user'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth || 640;
  canvas.height = videoElement.videoHeight || 640;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Mirror selfie camera for natural orientation
  if (facingMode === 'user') {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Triggers the native OS Camera Intent via hidden file input with capture attribute.
 * This is 100% supported by Android WebView & iOS WKWebView without needing WebRTC permissions!
 */
export function launchNativeDeviceCamera(
  facingMode: 'user' | 'environment' = 'user',
  onPhotoCaptured: (dataUrl: string) => void,
  onError?: (err: string) => void
): void {
  // Create or reuse hidden file input
  const inputId = `native-camera-intent-${facingMode}`;
  let input = document.getElementById(inputId) as HTMLInputElement | null;
  if (!input) {
    input = document.createElement('input');
    input.id = inputId;
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);
  }

  // 'user' for front selfie camera, 'environment' for rear camera
  input.setAttribute('capture', facingMode);

  input.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onPhotoCaptured(dataUrl);
      }
    };
    reader.onerror = () => {
      onError?.('فشل في قراءة الصورة الملتقطة من كاميرا الهاتف');
    };
    reader.readAsDataURL(file);

    // Reset input so subsequent captures re-trigger onchange
    input.value = '';
  };

  input.click();
}
