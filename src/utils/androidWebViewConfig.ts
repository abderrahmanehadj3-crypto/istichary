// ==============================================================================
// Android WebView & Container Setup for Sari3 WebRTC Camera & Geolocation
// ==============================================================================
// This file documents and exports the exact native Android Java/Kotlin container
// configurations required for Android WebView to properly grant hardware sensor
// permissions (WebRTC camera stream, Geolocation API, DOM storage, and hardware
// accelerated video rendering) to the Sari3 application.
// ==============================================================================

/**
 * Android Java Configuration for MainActivity.java:
 * 
 * ```java
 * package com.sari3.app;
 * 
 * import android.Manifest;
 * import android.content.pm.PackageManager;
 * import android.os.Build;
 * import android.os.Bundle;
 * import android.webkit.GeolocationPermissions;
 * import android.webkit.PermissionRequest;
 * import android.webkit.WebChromeClient;
 * import android.webkit.WebSettings;
 * import android.webkit.WebView;
 * import android.webkit.WebViewClient;
 * import androidx.annotation.NonNull;
 * import androidx.appcompat.app.AppCompatActivity;
 * import androidx.core.app.ActivityCompat;
 * import androidx.core.content.ContextCompat;
 * 
 * public class MainActivity extends AppCompatActivity {
 * 
 *     private static final int PERMISSION_REQUEST_CODE = 1001;
 *     private WebView webView;
 * 
 *     @Override
 *     protected void onCreate(Bundle savedInstanceState) {
 *         super.onCreate(savedInstanceState);
 *         setContentView(R.layout.activity_main);
 * 
 *         webView = findViewById(R.id.webview);
 *         configureWebView(webView);
 * 
 *         // Check and request runtime Android permissions for Camera and Location
 *         requestAppPermissions();
 * 
 *         // Load Sari3 App URL (HTTPS required for camera & geolocation sensors)
 *         webView.loadUrl("https://sari3.app/");
 *     }
 * 
 *     private void configureWebView(WebView webView) {
 *         WebSettings webSettings = webView.getSettings();
 * 
 *         // 1. JavaScript & DOM Storage
 *         webSettings.setJavaScriptEnabled(true);
 *         webSettings.setDomStorageEnabled(true);
 *         webSettings.setDatabaseEnabled(true);
 * 
 *         // 2. Media & Autoplay Settings (Crucial for WebRTC Camera preview without extra clicks)
 *         webSettings.setMediaPlaybackRequiresUserGesture(false);
 *         webSettings.setAllowFileAccess(true);
 *         webSettings.setAllowContentAccess(true);
 * 
 *         // 3. Geolocation Web API Bridge
 *         webSettings.setGeolocationEnabled(true);
 * 
 *         // 4. Performance & Viewport
 *         webSettings.setUseWideViewPort(true);
 *         webSettings.setLoadWithOverviewMode(true);
 *         webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
 * 
 *         webView.setWebViewClient(new WebViewClient());
 * 
 *         // 5. WebChromeClient for Camera WebRTC & Geolocation prompt handling
 *         webView.setWebChromeClient(new WebChromeClient() {
 *             // WebRTC Camera & Microphone Hardware Grant
 *             @Override
 *             public void onPermissionRequest(final PermissionRequest request) {
 *                 runOnUiThread(() -> {
 *                     // Grant all requested resources (RESOURCE_VIDEO_CAPTURE, RESOURCE_AUDIO_CAPTURE)
 *                     request.grant(request.getResources());
 *                 });
 *             }
 * 
 *             // Geolocation Web API Grant
 *             @Override
 *             public void onGeolocationPermissionsShowPrompt(
 *                     final String origin,
 *                     final GeolocationPermissions.Callback callback) {
 *                 // Always grant geolocation permission to the app origin and remember
 *                 callback.invoke(origin, true, true);
 *             }
 *         });
 *     }
 * 
 *     private void requestAppPermissions() {
 *         String[] permissions = new String[] {
 *             Manifest.permission.CAMERA,
 *             Manifest.permission.ACCESS_FINE_LOCATION,
 *             Manifest.permission.ACCESS_COARSE_LOCATION,
 *             Manifest.permission.MODIFY_AUDIO_SETTINGS
 *         };
 * 
 *         boolean needRequest = false;
 *         for (String perm : permissions) {
 *             if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
 *                 needRequest = true;
 *                 break;
 *             }
 *         }
 * 
 *         if (needRequest) {
 *             ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_CODE);
 *         }
 *     }
 * }
 * ```
 * 
 * AndroidManifest.xml Requirements:
 * 
 * ```xml
 * <manifest xmlns:android="http://schemas.android.com/apk/res/android"
 *     package="com.sari3.app">
 * 
 *     <!-- Network & Internet -->
 *     <uses-permission android:name="android.permission.INTERNET" />
 *     <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
 * 
 *     <!-- Camera & Hardware Features for WebRTC -->
 *     <uses-permission android:name="android.permission.CAMERA" />
 *     <uses-feature android:name="android.hardware.camera" android:required="false" />
 *     <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
 *     <uses-feature android:name="android.hardware.camera.front" android:required="false" />
 * 
 *     <!-- Location / GPS -->
 *     <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
 *     <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
 *     <uses-feature android:name="android.hardware.location.gps" android:required="false" />
 * 
 *     <!-- Audio (Optional if microphone used in future) -->
 *     <uses-permission android:name="android.permission.RECORD_AUDIO" />
 *     <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
 * 
 *     <application
 *         android:allowBackup="true"
 *         android:hardwareAccelerated="true"
 *         android:usesCleartextTraffic="false"
 *         android:theme="@style/Theme.AppCompat.NoActionBar">
 *         ...
 *     </application>
 * </manifest>
 * ```
 */

export interface WebViewEnvironmentInfo {
  isWebView: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isSecureContext: boolean;
  supportsWebRTC: boolean;
  supportsGeolocation: boolean;
}

/**
 * Inspect runtime environment to verify secure context and hardware sensor bridges
 */
export function getRuntimeEnvironmentInfo(): WebViewEnvironmentInfo {
  if (typeof window === 'undefined') {
    return {
      isWebView: false,
      isAndroid: false,
      isIOS: false,
      isSecureContext: false,
      supportsWebRTC: false,
      supportsGeolocation: false,
    };
  }

  const ua = window.navigator.userAgent.toLowerCase();
  const isAndroid = /android/i.test(ua);
  const isIOS = /(iphone|ipod|ipad)/i.test(ua);

  // Detect Android WebView or iOS WKWebView
  const isAndroidWebView = /wv|android.*version\/[0-9.]+/i.test(ua);
  const isIOSWebView = isIOS && !ua.includes('safari');
  const isCapacitor = !!(window as any).Capacitor;
  const isCordova = !!(window as any).cordova || !!(window as any).PhoneGap;
  const isMedian = !!(window as any).median || !!(window as any).gonative;

  const isWebView = isAndroidWebView || isIOSWebView || isCapacitor || isCordova || isMedian;

  // Modern browsers require HTTPS or localhost for getUserMedia and Geolocation
  const isSecureContext =
    window.isSecureContext ||
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  const supportsWebRTC = !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );

  const supportsGeolocation = !!(
    navigator.geolocation &&
    typeof navigator.geolocation.getCurrentPosition === 'function'
  );

  return {
    isWebView,
    isAndroid,
    isIOS,
    isSecureContext,
    supportsWebRTC,
    supportsGeolocation,
  };
}
