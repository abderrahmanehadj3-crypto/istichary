package com.sari3.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.GeolocationPermissions
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.annotation.NonNull
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

        // Handle Back button press inside WebView
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

        // Load the Sari3 web frontend
        webView.loadUrl(TARGET_APP_URL)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        val settings: WebSettings = webView.settings

        // 1. JavaScript & DOM Storage (Critical for React SPA)
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true

        // 2. Hardware WebRTC Media & Audio Settings (Critical for Camera stream without user gesture block)
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = true
        settings.allowContentAccess = true

        // 3. Geolocation Bridge
        settings.setGeolocationEnabled(true)

        // 4. Viewport & Rendering Performance (Hardware Acceleration)
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW // Force strict HTTPS

        // Enable Hardware Acceleration for Canvas & WebGL Face Detection
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)

        // 5. WebViewClient for inside-app navigation
        webView.webViewClient = object : WebViewClient() {
            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
            }
        }

        // 6. WebChromeClient: Dynamically Grant WebRTC Camera and Geolocation Prompts
        webView.webChromeClient = object : WebChromeClient() {

            // Dynamically Grant WebRTC Camera / Microphone Permissions to the Web App
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    // Grants requested resources: RESOURCE_VIDEO_CAPTURE and RESOURCE_AUDIO_CAPTURE
                    request.grant(request.resources)
                }
            }

            // Grant Geolocation to the web origin
            override fun onGeolocationPermissionsShowPrompt(
                origin: String,
                callback: GeolocationPermissions.Callback
            ) {
                // Grant permission and do not retain if user declines at system level
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
                    "يرجى تمكين إذن الكاميرا والموقع الجغرافي للاستفادة الكاملة من ميزات تطبيق سريع",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }
}
