# Sari3 Native Android Studio Implementation Guide
## إعداد تطبيق أندرويد الأصلي (APK / Android Studio)

هذا المجلد يحتوي على إعدادات مشروع Android Studio الكاملة لتغليف الواجهة البرمجية لتطبيق سريع (Sari3) عبر `WebView` مع تفعيل كامل ومباشر لكاميرا التحقق البيومتري (WebRTC Face Detection) ونظام تحديد المواقع (GPS Geolocation).

---

### 1. الملفات الرئيسية المنشأة
- `AndroidManifest.xml`: يحتوي على كافة الأذونات وخصائص العتاد (`CAMERA`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `hardwareAccelerated="true"`).
- `MainActivity.kt` و `MainActivity.java`: الكود المصدري الكامل الذي يربط `WebChromeClient.onPermissionRequest` و `onGeolocationPermissionsShowPrompt` ويمنح صلاحيات الكاميرا والصوت والموقع فوراً.
- `activity_main.xml`: تصميم الواجهة الحاوية لـ WebView مع دعم تسريع العتاد.
- `build.gradle` و `app/build.gradle`: إعدادات البناء لـ Android SDK 34 مع مكتبات AndroidX و Android WebKit.

---

### 2. كيفية البناء عبر Android Studio
1. افتح **Android Studio**.
2. اختر **Open an Existing Project** وحدد مجلد `android/`.
3. انتظر اكتمال مزامنة Gradle (Gradle Sync).
4. تأكد من ضبط الرابط في `MainActivity.kt` أو `MainActivity.java`:
   ```kotlin
   private val TARGET_APP_URL = "https://tichary.vercel.app"
   ```
5. قم بتوصيل هاتف أندرويد حقيقي أو تشغيل محاكي Android Emulator (يدعم الكاميرا).
6. انقر على **Run 'app'** أو اختر من القائمة: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

---

### 3. بنود الأمان وأذونات WebRTC و Geolocation
- **WebChromeClient onPermissionRequest**:
  عندما يطلب كود الجافاسكربت في المتصفح `navigator.mediaDevices.getUserMedia(...)`، يقوم النظام باستدعاء `onPermissionRequest`. تم تضمين:
  ```kotlin
  override fun onPermissionRequest(request: PermissionRequest) {
      runOnUiThread {
          request.grant(request.resources)
      }
  }
  ```
- **WebChromeClient onGeolocationPermissionsShowPrompt**:
  يمنح المتصفح صلاحية الوصول لنظام GPS دون إيقاف العملية:
  ```kotlin
  override fun onGeolocationPermissionsShowPrompt(origin: String, callback: GeolocationPermissions.Callback) {
      callback.invoke(origin, true, false)
  }
  ```
- **تسريع العتاد (Hardware Acceleration)**:
  مفعل في `AndroidManifest.xml` و `webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)` لضمان سلاسة معالجة الرسوميات وحسابات كشف الوجه ومطابقة بطاقة الهوية ورخصة السياقة.
