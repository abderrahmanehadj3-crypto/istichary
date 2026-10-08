// ==============================================================================
// Android WebView & Container Setup for Sari3 WebRTC Camera & Geolocation
// ==============================================================================
// This file documents and exports the exact native Android Java/Kotlin container
// configurations required for Android WebView to properly grant hardware sensor
// permissions (WebRTC camera stream, Geolocation API, DOM storage, and hardware
// accelerated video rendering) to the Sari3 application.
// ==============================================================================

export const SARI3_NATIVE_ANDROID_CONFIG = {
  defaultAppUrl: 'https://tichary.vercel.app',
  packageName: 'com.sari3.app',
  permissions: [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.CAMERA',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.RECORD_AUDIO',
    'android.permission.MODIFY_AUDIO_SETTINGS',
  ],
  features: [
    { name: 'android.hardware.camera', required: true },
    { name: 'android.hardware.camera.autofocus', required: false },
    { name: 'android.hardware.camera.front', required: false },
    { name: 'android.hardware.location.gps', required: false },
  ],
};

export const ANDROID_MANIFEST_SNIPPET = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.sari3.app">

    <!-- Network & Internet -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Camera & Hardware Features for WebRTC -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="true" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
    <uses-feature android:name="android.hardware.camera.front" android:required="false" />

    <!-- Location / GPS -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />

    <!-- Audio -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="false"
        android:theme="@style/Theme.Sari3App">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize"
            android:hardwareAccelerated="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>
</manifest>`;

export const ANDROID_KOTLIN_MAIN_ACTIVITY_SNIPPET = `package com.sari3.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.View
import android.webkit.GeolocationPermissions
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val PERMISSION_REQUEST_CODE = 2001
    private val TARGET_APP_URL = "https://tichary.vercel.app"

    private val REQUIRED_PERMISSIONS = arrayOf(
        Manifest.permission.CAMERA,
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.RECORD_AUDIO
    )

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        configureWebView()
        checkAndRequestNativePermissions()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

        webView.loadUrl(TARGET_APP_URL)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        val settings: WebSettings = webView.settings

        // 1. JavaScript & DOM Storage
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true

        // 2. Hardware WebRTC Media & Audio Settings
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = true
        settings.allowContentAccess = true

        // 3. Geolocation Bridge
        settings.setGeolocationEnabled(true)

        // 4. Viewport & Rendering Performance (Hardware Acceleration)
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW

        // Enable Hardware Acceleration for Canvas & WebGL Face Detection
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)

        webView.webViewClient = WebViewClient()

        // 5. WebChromeClient: Dynamically Grant WebRTC Camera and Geolocation Prompts
        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    // Grant requested camera and audio resources immediately
                    request.grant(request.resources)
                }
            }

            override fun onGeolocationPermissionsShowPrompt(
                origin: String,
                callback: GeolocationPermissions.Callback
            ) {
                callback.invoke(origin, true, false)
            }
        }
    }

    private fun checkAndRequestNativePermissions() {
        val permissionsToRequest = ArrayList<String>()
        for (permission in REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(permission)
            }
        }

        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            var allGranted = true
            for (result in grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false
                    break
                }
            }
            if (!allGranted) {
                Toast.makeText(
                    this,
                    "يرجى تمكين إذن الكاميرا والموقع الجغرافي للاستفادة الكاملة من تطبيق سريع",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }
}`;
export const ANDROID_JAVA_MAIN_ACTIVITY_SNIPPET = `package com.sari3.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.View;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    private static final int PERMISSION_REQUEST_CODE = 2001;
    private static final String TARGET_APP_URL = "https://tichary.vercel.app";

    private WebView webView;

    private final String[] REQUIRED_PERMISSIONS = new String[]{
            Manifest.permission.CAMERA,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.RECORD_AUDIO
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);

        configureWebView();
        checkAndRequestNativePermissions();

        webView.loadUrl(TARGET_APP_URL);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        WebSettings settings = webView.getSettings();

        // 1. JavaScript & DOM Storage
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);

        // 2. Hardware WebRTC Media & Audio Settings
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        // 3. Geolocation Bridge
        settings.setGeolocationEnabled(true);

        // 4. Viewport & Rendering Performance
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        webView.setWebViewClient(new WebViewClient());

        // 5. WebChromeClient for Camera & Location
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> request.grant(request.getResources()));
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(
                    final String origin,
                    final GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }
        });
    }

    private void checkAndRequestNativePermissions() {
        List<String> permissionsToRequest = new ArrayList<>();
        for (String permission : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(permission);
            }
        }

        if (!permissionsToRequest.isEmpty()) {
            ActivityCompat.requestPermissions(
                    this,
                    permissionsToRequest.toArray(new String[0]),
                    PERMISSION_REQUEST_CODE
            );
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean allGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            if (!allGranted) {
                Toast.makeText(
                        this,
                        "يرجى تمكين إذن الكاميرا والموقع الجغرافي للاستفادة الكاملة من تطبيق سريع",
                        Toast.LENGTH_LONG
                ).show();
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}`;

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
