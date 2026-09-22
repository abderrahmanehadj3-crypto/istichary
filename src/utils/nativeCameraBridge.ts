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
 * Triggers the native OS Camera Intent directly.
 * 100% supported by Android WebViews (Median / Cordova / Capacitor / InAppBrowser)
 * directly invoking the device's native camera application.
 */
export function launchNativeDeviceCamera(
  facingMode: 'user' | 'environment' = 'user',
  onPhotoCaptured: (dataUrl: string) => void,
  onError?: (err: string) => void
): void {
  // 1. Median wrapper native bridge check
  if (typeof window !== 'undefined') {
    const median = (window as any).median || (window as any).gonative;
    if (median?.camera?.takePicture) {
      try {
        median.camera.takePicture({
          source: 'camera',
          facing: facingMode === 'user' ? 'front' : 'back',
          callback: (res: any) => {
            if (res && res.image) {
              const dataUrl = res.image.startsWith('data:')
                ? res.image
                : `data:image/jpeg;base64,${res.image}`;
              onPhotoCaptured(dataUrl);
            } else if (res && res.url) {
              onPhotoCaptured(res.url);
            }
          },
        });
        return;
      } catch (medianErr) {
        console.warn('[CameraBridge] Median camera bridge failed, using native input:', medianErr);
      }
    }

    // 2. Capacitor Camera plugin check
    const capacitorCamera = (window as any).Capacitor?.Plugins?.Camera;
    if (capacitorCamera?.getPhoto) {
      capacitorCamera
        .getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: 'dataUrl',
          source: 'CAMERA',
          direction: facingMode === 'user' ? 'FRONT' : 'REAR',
        })
        .then((photo: any) => {
          if (photo && photo.dataUrl) {
            onPhotoCaptured(photo.dataUrl);
          }
        })
        .catch((err: any) => {
          console.warn('[CameraBridge] Capacitor camera failed, using native input:', err);
          triggerNativeFileInput(facingMode, onPhotoCaptured, onError);
        });
      return;
    }
  }

  // 3. Android WebView native intent via invisible capture input
  triggerNativeFileInput(facingMode, onPhotoCaptured, onError);
}

function triggerNativeFileInput(
  facingMode: 'user' | 'environment',
  onPhotoCaptured: (dataUrl: string) => void,
  onError?: (err: string) => void
): void {
  const inputId = `sari3-native-camera-${facingMode}-${Date.now()}`;
  const input = document.createElement('input');
  input.id = inputId;
  input.type = 'file';
  input.accept = 'image/*';
  // HTML Media Capture specification: 'user' = selfie/front, 'environment' = rear camera
  input.setAttribute('capture', facingMode);
  input.style.position = 'fixed';
  input.style.top = '-9999px';
  input.style.left = '-9999px';
  input.style.opacity = '0';
  document.body.appendChild(input);

  input.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      if (input.parentNode) document.body.removeChild(input);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onPhotoCaptured(dataUrl);
      }
      if (input.parentNode) document.body.removeChild(input);
    };
    reader.onerror = () => {
      onError?.('تعذر قراءة الصورة من كاميرا الهاتف');
      if (input.parentNode) document.body.removeChild(input);
    };
    reader.readAsDataURL(file);
  };

  // Immediate native intent invocation
  input.click();
}
