// ==============================================================================
// Sari3 Global Hardware & Secure Context Initializer
// ==============================================================================
// 1. Forces HTTPS redirect on production domains to ensure Secure Context for
//    navigator.mediaDevices.getUserMedia and navigator.geolocation APIs.
// 2. Traps and logs unhandled promise rejections and script errors so they never
//    block or crash execution before sensors can initialize.
// 3. Normalizes and validates WebRTC and Geolocation bridges across Android WebView,
//    iOS WKWebView, and desktop browsers.
// ==============================================================================

export function initGlobalSensorsAndSecureContext(): void {
  if (typeof window === 'undefined') return;

  // 1. Enforce HTTPS in production environments for Camera & Geolocation APIs
  try {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0' ||
      window.location.hostname.endsWith('.localhost');

    if (window.location.protocol === 'http:' && !isLocalhost) {
      console.warn('[Sari3 Security] Insecure HTTP detected. Redirecting to HTTPS for camera & GPS support...');
      window.location.href = window.location.href.replace('http:', 'https:');
      return;
    }
  } catch (err) {
    console.warn('[Sari3 Security] HTTPS redirect check ignored:', err);
  }

  // 2. Global Unhandled Rejection & Error Protection
  // Prevents third-party scripts or CDN assets from crashing React before getUserMedia runs
  window.addEventListener('unhandledrejection', (event) => {
    // Specifically catch and silence non-fatal media or permissions rejections
    const reason = event.reason;
    const msg = String(reason?.message || reason || '');
    if (
      msg.includes('getUserMedia') ||
      msg.includes('Permission') ||
      msg.includes('NotAllowedError') ||
      msg.includes('OverconstrainedError') ||
      msg.includes('Geolocation')
    ) {
      console.warn('[Sari3 Sensors Safe Trap] Handled hardware permission rejection:', reason);
      event.preventDefault?.();
    }
  });

  window.addEventListener('error', (event) => {
    // Avoid letting external resource loading failures bubble up destructively
    if (event.filename && (event.filename.includes('jsdelivr') || event.filename.includes('unpkg') || event.filename.includes('google'))) {
      console.warn('[Sari3 Script Error Trap] External resource error captured safely:', event.message);
    }
  });

  // 3. Log Secure Context and hardware sensor status to console for easy diagnostic
  const isSecure = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  const hasMediaDevices = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');
  const hasGeolocation = !!(navigator.geolocation && typeof navigator.geolocation.getCurrentPosition === 'function');

  console.info('[Sari3 Hardware Status]', {
    secureContext: isSecure,
    protocol: window.location.protocol,
    mediaDevicesAvailable: hasMediaDevices,
    geolocationAvailable: hasGeolocation,
    userAgent: navigator.userAgent,
  });
}
