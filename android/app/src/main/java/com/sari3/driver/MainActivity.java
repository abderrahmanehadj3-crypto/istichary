package com.sari3.driver;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.View;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
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

    private WebView webView;
    private static final int PERMISSION_REQUEST_CODE = 100;
    private static final int FILE_CHOOSER_REQUEST_CODE = 200;

    // Callback used for WebView file picker and camera photo upload
    private ValueCallback<Uri[]> mFilePathCallback;

    // Sari3 Application Web URL
    private final String WEB_URL = "https://tichary.vercel.app";

    private final String[] REQUIRED_PERMISSIONS = new String[]{
            Manifest.permission.CAMERA,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
    };

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);

        // 1. Configure WebView Settings & WebChromeClient
        configureWebView();

        // 2. Check and request native OS permissions (Camera and Location)
        checkAndRequestPermissions();

        // 3. Load the Sari3 web frontend
        webView.loadUrl(WEB_URL);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        WebSettings webSettings = webView.getSettings();

        // Core JavaScript & Storage settings for React SPA
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);

        // Hardware Media and WebRTC configuration
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false); // Allows instant camera stream on user action

        // Geolocation Web API bridge
        webSettings.setGeolocationEnabled(true);

        // Viewport & Rendering optimizations
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Strict HTTPS context
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        }

        // Enable Hardware Acceleration for Canvas & WebGL Face Detection
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
            }
        });

        // WebChromeClient: WebRTC Camera, Geolocation, and Native File Chooser / Camera Intent
        webView.setWebChromeClient(new WebChromeClient() {

            // 1. Native File Chooser & Camera Intent for <input type="file">
            @Override
            public boolean onShowFileChooser(
                    WebView webView,
                    ValueCallback<Uri[]> filePathCallback,
                    FileChooserParams fileChooserParams) {

                // Cancel any previous pending callback to prevent lockups
                if (mFilePathCallback != null) {
                    mFilePathCallback.onReceiveValue(null);
                    mFilePathCallback = null;
                }
                mFilePathCallback = filePathCallback;

                try {
                    // Try default intent created by fileChooserParams first
                    Intent intent = fileChooserParams.createIntent();
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST_CODE);
                } catch (Exception e) {
                    // Fallback to gallery chooser + camera capture
                    try {
                        Intent galleryIntent = new Intent(Intent.ACTION_GET_CONTENT);
                        galleryIntent.addCategory(Intent.CATEGORY_OPENABLE);
                        galleryIntent.setType("image/*");

                        Intent cameraIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);

                        Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
                        chooserIntent.putExtra(Intent.EXTRA_INTENT, galleryIntent);
                        chooserIntent.putExtra(Intent.EXTRA_TITLE, "التقط صورة أو اختر من المعرض");
                        chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{cameraIntent});

                        startActivityForResult(chooserIntent, FILE_CHOOSER_REQUEST_CODE);
                    } catch (Exception ex) {
                        if (mFilePathCallback != null) {
                            mFilePathCallback.onReceiveValue(null);
                            mFilePathCallback = null;
                        }
                        return false;
                    }
                }
                return true;
            }

            // 2. WebRTC Live Camera & Microphone Grant
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
                            == PackageManager.PERMISSION_GRANTED) {
                        request.grant(request.getResources());
                    } else {
                        ActivityCompat.requestPermissions(
                                MainActivity.this,
                                new String[]{Manifest.permission.CAMERA},
                                PERMISSION_REQUEST_CODE
                        );
                        request.grant(request.getResources());
                    }
                });
            }

            // 3. Geolocation Web API Prompt Grant
            @Override
            public void onGeolocationPermissionsShowPrompt(
                    final String origin,
                    final GeolocationPermissions.Callback callback) {
                runOnUiThread(() -> {
                    callback.invoke(origin, true, false);
                });
            }
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        // Handle file chooser result (Photo taken or Gallery image selected)
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (mFilePathCallback == null) return;

            Uri[] results = null;
            if (resultCode == RESULT_OK && data != null) {
                String dataString = data.getDataString();
                if (dataString != null) {
                    results = new Uri[]{Uri.parse(dataString)};
                } else if (data.getClipData() != null) {
                    int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int i = 0; i < count; i++) {
                        results[i] = data.getClipData().getItemAt(i).getUri();
                    }
                }
            }

            // Send selected URI to the WebView and clear callback
            mFilePathCallback.onReceiveValue(results);
            mFilePathCallback = null;
        }
    }

    private void checkAndRequestPermissions() {
        List<String> permissionsToRequest = new ArrayList<>();
        for (String perm : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(perm);
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
            boolean cameraGranted = false;
            boolean locationGranted = false;

            for (int i = 0; i < permissions.length; i++) {
                if (Manifest.permission.CAMERA.equals(permissions[i]) &&
                        grantResults[i] == PackageManager.PERMISSION_GRANTED) {
                    cameraGranted = true;
                }
                if ((Manifest.permission.ACCESS_FINE_LOCATION.equals(permissions[i]) ||
                        Manifest.permission.ACCESS_COARSE_LOCATION.equals(permissions[i])) &&
                        grantResults[i] == PackageManager.PERMISSION_GRANTED) {
                    locationGranted = true;
                }
            }

            if (cameraGranted && locationGranted) {
                Toast.makeText(this, "تم تفعيل صلاحيات الكاميرا والموقع الجغرافي بنجاح", Toast.LENGTH_SHORT).show();
            } else if (!cameraGranted) {
                Toast.makeText(this, "يرجى منح إذن الكاميرا لإتمام التحقق من هوية السائق", Toast.LENGTH_LONG).show();
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
}
