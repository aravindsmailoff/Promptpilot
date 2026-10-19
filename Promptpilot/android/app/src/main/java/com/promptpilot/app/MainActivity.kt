package com.promptpilot.app

import android.app.AlertDialog
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageButton
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.browser.customtabs.CustomTabsIntent
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private lateinit var googleSignInClient: GoogleSignInClient

    // Native Google Sign-In launcher
    private val googleSignInLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result: ActivityResult ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account: GoogleSignInAccount = task.getResult(ApiException::class.java)
            val idToken = account.idToken
            val email = account.email ?: ""
            val displayName = account.displayName ?: email.split("@")[0]
            val photoUrl = account.photoUrl?.toString() ?: ""
            if (idToken != null) {
                // Inject the token into the WebView for Firebase to process
                val js = "window._nativeGoogleSignInCallback('$idToken', '$email', '${displayName.replace("'", "\\'")  }', '$photoUrl');"
                runOnUiThread {
                    webView.evaluateJavascript(js, null)
                }
            } else {
                runOnUiThread {
                    webView.evaluateJavascript("window._nativeGoogleSignInError('No ID token returned');", null)
                }
            }
        } catch (e: ApiException) {
            runOnUiThread {
                webView.evaluateJavascript("window._nativeGoogleSignInError('${e.message?.replace("'", "\\'") ?: "Sign-in failed"}');", null)
            }
        }
    }

    // Android Bridge exposed to JavaScript
    inner class AndroidBridge {
        @JavascriptInterface
        fun startGoogleSignIn() {
            // Sign out first to force account chooser
            googleSignInClient.signOut().addOnCompleteListener {
                val signInIntent = googleSignInClient.signInIntent
                runOnUiThread {
                    googleSignInLauncher.launch(signInIntent)
                }
            }
        }

        @JavascriptInterface
        fun setServerUrl(url: String) {
            val trimmed = url.trim()
            if (trimmed.isNotEmpty()) {
                val fullUrl = if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) "https://$trimmed" else trimmed
                getSharedPreferences("promptpilot_prefs", MODE_PRIVATE).edit().putString("server_url", fullUrl).apply()
                runOnUiThread {
                    webView.loadUrl(fullUrl)
                }
            }
        }

        @JavascriptInterface
        fun openUrlConfig() {
            runOnUiThread {
                showUrlConfigDialog()
            }
        }
    }

    // Launcher for file picker activity
    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val uris = if (result.resultCode == RESULT_OK) {
            val data = result.data
            val clipData = data?.clipData
            val uriList = mutableListOf<Uri>()
            if (clipData != null) {
                for (i in 0 until clipData.itemCount) {
                    uriList.add(clipData.getItemAt(i).uri)
                }
            } else {
                val uri = data?.data
                if (uri != null) {
                    uriList.add(uri)
                }
            }
            if (uriList.isNotEmpty()) uriList.toTypedArray() else null
        } else {
            null
        }
        fileChooserCallback?.onReceiveValue(uris)
        fileChooserCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        requestWindowFeature(android.view.Window.FEATURE_NO_TITLE)
        actionBar?.hide()
        super.onCreate(savedInstanceState)
        
        window.statusBarColor = Color.parseColor("#020617")
        window.navigationBarColor = Color.parseColor("#020617")

        val sharedPrefs = getSharedPreferences("promptpilot_prefs", MODE_PRIVATE)

        val isEmulator = Build.FINGERPRINT.startsWith("generic") ||
            Build.FINGERPRINT.startsWith("unknown") ||
            Build.MODEL.contains("google_sdk", ignoreCase = true) ||
            Build.MODEL.contains("Emulator", ignoreCase = true) ||
            Build.MODEL.contains("Android SDK", ignoreCase = true) ||
            Build.MANUFACTURER.contains("Genymotion", ignoreCase = true) ||
            (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic")) ||
            Build.PRODUCT.startsWith("sdk") ||
            Build.HARDWARE == "goldfish" || Build.HARDWARE == "ranchu"
        val fallbackDefault = "file:///android_asset/index.html"
        val serverUrl = sharedPrefs.getString("server_url", null) ?: run {
            sharedPrefs.edit().putString("server_url", fallbackDefault).apply()
            fallbackDefault
        }

        // Initialize native Google Sign-In
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken("708444926819-u9lm4e3bmt2f3r47vdrabv0onud3k39p.apps.googleusercontent.com")
            .requestEmail()
            .requestProfile()
            .build()
        googleSignInClient = GoogleSignIn.getClient(this, gso)

        // Create root layout
        val rootLayout = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#0f0f1a"))
        }

        // Create WebView
        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#0f0f1a"))

            // Enable cookie persistence
            val currentWebView = this
            CookieManager.getInstance().setAcceptCookie(true)
            CookieManager.getInstance().setAcceptThirdPartyCookies(currentWebView, true)


            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                setSupportMultipleWindows(true)
                javaScriptCanOpenWindowsAutomatically = true
                mediaPlaybackRequiresUserGesture = false
                
                userAgentString = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
            }

            // Expose Android bridge to JavaScript for native Google Sign-In
            addJavascriptInterface(AndroidBridge(), "AndroidBridge")

            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                    if (url != null) {
                        // Handle deep link intents
                        if (url.startsWith("promptpilot://") || url.startsWith("spark://")) {
                            webView.loadUrl(serverUrl)
                            return true
                        }

                        // Keep navigation inside WebView for local/LAN addresses and Firebase/Google Auth/Hosted servers
                        val cleanServerUrl = serverUrl.trimEnd('/')
                        if (url.startsWith("file:///android_asset") ||
                            url.startsWith("http://10.0.2.2") ||
                            url.startsWith("http://localhost") ||
                            url.startsWith("http://192.168.") ||
                            url.startsWith("http://10.") ||
                            (cleanServerUrl.isNotEmpty() && url.startsWith(cleanServerUrl)) ||
                            url.contains("onrender.com") ||
                            url.contains("ngrok-free.dev") ||
                            url.contains("ngrok-free.app") ||
                            url.contains("trycloudflare.com") ||
                            url.contains("vercel.app") ||
                            url.contains("firebaseapp.com") ||
                            url.contains("identitytoolkit.googleapis.com") ||
                            url.contains("oauth2.googleapis.com")) {
                            return false
                        }

                        // Otherwise launch external browser for unrelated links
                        try {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                            startActivity(intent)
                            return true
                        } catch (e: Exception) {
                            return false
                        }
                    }
                    return false
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    try {
                        CookieManager.getInstance().flush()
                        if (url != null && url.contains("/api/auth/callback")) {
                            view?.postDelayed({
                                view.loadUrl(serverUrl)
                            }, 1000)
                        }
                    } catch (e: Exception) {}
                }

                @Suppress("OVERRIDE_DEPRECATION")
                override fun onReceivedError(
                    view: WebView?,
                    errorCode: Int,
                    description: String?,
                    failingUrl: String?
                ) {
                    if (failingUrl != null && !failingUrl.startsWith("file:///android_asset")) {
                        runOnUiThread {
                            android.widget.Toast.makeText(this@MainActivity, "Server offline. Loading bundled app...", android.widget.Toast.LENGTH_SHORT).show()
                            view?.loadUrl("file:///android_asset/index.html")
                        }
                        return
                    }
                    val safeUrl = serverUrl
                    val errorHtml = """
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <style>
                                * { margin:0; padding:0; box-sizing:border-box; }
                                body {
                                    background:#0f0f1a;
                                    color:#e2e8f0;
                                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                                    display:flex;
                                    flex-direction:column;
                                    align-items:center;
                                    justify-content:center;
                                    min-height:100vh;
                                    padding:24px;
                                    text-align:center;
                                }
                                .icon { font-size:64px; margin-bottom:24px; }
                                h1 { font-size:22px; font-weight:700; color:#a78bfa; margin-bottom:12px; }
                                p { font-size:14px; color:#94a3b8; line-height:1.6; margin-bottom:8px; }
                                .url {
                                    font-family:monospace;
                                    font-size:13px;
                                    color:#7dd3fc;
                                    background:#1e1e2e;
                                    padding:8px 16px;
                                    border-radius:8px;
                                    margin:16px 0;
                                    word-break:break-all;
                                }
                                .steps {
                                    text-align:left;
                                    background:#1e1e2e;
                                    border-radius:12px;
                                    padding:16px;
                                    margin:16px 0;
                                    width:100%;
                                }
                                .steps li { font-size:13px; color:#cbd5e1; margin-bottom:8px; padding-left:4px; }
                                .retry-btn {
                                    background:linear-gradient(135deg,#6366f1,#8b5cf6);
                                    color:white;
                                    border:none;
                                    padding:14px 32px;
                                    border-radius:12px;
                                    font-size:16px;
                                    font-weight:600;
                                    cursor:pointer;
                                .cloud-box {
                                    margin-top: 20px;
                                    width: 100%;
                                    max-width: 320px;
                                    background: #1e1e2e;
                                    border-radius: 12px;
                                    padding: 16px;
                                    border: 1px solid rgba(255,255,255,0.08);
                                }
                                .cloud-input {
                                    width: 100%;
                                    padding: 12px;
                                    border-radius: 8px;
                                    border: 1px solid #334155;
                                    background: #0f0f1a;
                                    color: #fff;
                                    font-size: 14px;
                                    margin-bottom: 10px;
                                    box-sizing: border-box;
                                }
                                .cloud-btn {
                                    background: linear-gradient(135deg, #10b981, #059669);
                                    color: white;
                                    border: none;
                                    padding: 12px;
                                    border-radius: 8px;
                                    font-size: 15px;
                                    font-weight: 600;
                                    width: 100%;
                                    cursor: pointer;
                                }
                                .secondary-btn {
                                    background: transparent;
                                    color: #94a3b8;
                                    border: 1px solid #334155;
                                    padding: 10px;
                                    border-radius: 8px;
                                    font-size: 13px;
                                    margin-top: 10px;
                                    width: 100%;
                                    cursor: pointer;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="icon">⚡</div>
                            <h1>Cannot Connect to Server</h1>
                            <p>Connecting to: <span class="url">$safeUrl</span></p>

                            <div class="cloud-box">
                                <p style="font-size:13px; color:#cbd5e1; margin-bottom:10px; text-align:left;"><strong>☁️ Cloud / Vercel Server URL:</strong></p>
                                <input id="cloudInput" class="cloud-input" type="text" placeholder="https://your-app.vercel.app" />
                                <button class="cloud-btn" onclick="saveAndConnect()">Connect to Cloud</button>
                                <button class="secondary-btn" onclick="openConfig()">⚙️ Advanced Settings</button>
                            </div>

                            <button class="retry-btn" onclick="window.location.reload()">&#x1F504; Retry Current URL</button>

                            <script>
                                function saveAndConnect() {
                                    var val = document.getElementById('cloudInput').value.trim();
                                    if (!val) { alert('Please enter your cloud URL'); return; }
                                    if (window.AndroidBridge && window.AndroidBridge.setServerUrl) {
                                        window.AndroidBridge.setServerUrl(val);
                                    } else {
                                        var target = (val.indexOf('http://') === 0 || val.indexOf('https://') === 0) ? val : 'https://' + val;
                                        window.location.href = target;
                                    }
                                }
                                function openConfig() {
                                    if (window.AndroidBridge && window.AndroidBridge.openUrlConfig) {
                                        window.AndroidBridge.openUrlConfig();
                                    }
                                }
                            </script>
                        </body>
                        </html>
                    """.trimIndent()
                    view?.loadDataWithBaseURL(safeUrl, errorHtml, "text/html", "UTF-8", null)
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onShowFileChooser(
                    webView: WebView?,
                    filePathCallback: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {
                    fileChooserCallback?.onReceiveValue(null)
                    fileChooserCallback = filePathCallback

                    try {
                        val intent = fileChooserParams?.createIntent()
                        if (intent != null) {
                            filePickerLauncher.launch(intent)
                        } else {
                            val fallbackIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                                type = "*/*"
                                addCategory(Intent.CATEGORY_OPENABLE)
                                putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
                            }
                            filePickerLauncher.launch(fallbackIntent)
                        }
                    } catch (e: Exception) {
                        fileChooserCallback?.onReceiveValue(null)
                        fileChooserCallback = null
                        return false
                    }
                    return true
                }

                private var activePopupDialog: AlertDialog? = null

                override fun onCreateWindow(
                    view: WebView?,
                    isDialog: Boolean,
                    isUserGesture: Boolean,
                    resultMsg: android.os.Message?
                ): Boolean {
                    val popupWebView = WebView(this@MainActivity).apply {
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        settings.userAgentString = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
                        webChromeClient = object : WebChromeClient() {
                            override fun onCloseWindow(window: WebView?) {
                                super.onCloseWindow(window)
                                try {
                                    activePopupDialog?.dismiss()
                                    activePopupDialog = null
                                } catch (e: Exception) {}
                                CookieManager.getInstance().flush()
                                this@MainActivity.webView.loadUrl(serverUrl)
                            }
                        }
                        webViewClient = object : WebViewClient() {
                            override fun shouldOverrideUrlLoading(v: WebView?, u: String?): Boolean {
                                if (u != null) {
                                    if (u.startsWith("promptpilot://") || u.startsWith("spark://")) {
                                        try {
                                            activePopupDialog?.dismiss()
                                            activePopupDialog = null
                                        } catch (e: Exception) {}
                                        this@MainActivity.webView.loadUrl(serverUrl)
                                        return true
                                    }
                                    if (u.contains("accounts.google.com")) {
                                        try {
                                            val customTabsIntent = CustomTabsIntent.Builder().build()
                                            customTabsIntent.launchUrl(this@MainActivity, Uri.parse(u))
                                            try {
                                                activePopupDialog?.dismiss()
                                                activePopupDialog = null
                                            } catch (e: Exception) {}
                                            return true
                                        } catch (e: Exception) {
                                            try {
                                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(u))
                                                startActivity(intent)
                                                activePopupDialog?.dismiss()
                                                activePopupDialog = null
                                            } catch (err: Exception) {}
                                            return true
                                        }
                                    }
                                }
                                return false
                            }

                            override fun onPageFinished(v: WebView?, u: String?) {
                                super.onPageFinished(v, u)
                                CookieManager.getInstance().flush()
                                if (u != null && u.contains("/api/auth/callback")) {
                                    v?.postDelayed({
                                        try {
                                            activePopupDialog?.dismiss()
                                            activePopupDialog = null
                                        } catch (e: Exception) {}
                                        this@MainActivity.webView.loadUrl(serverUrl)
                                    }, 1000)
                                }
                            }
                        }
                    }

                    val dialog = AlertDialog.Builder(this@MainActivity, android.R.style.Theme_Black_NoTitleBar_Fullscreen)
                        .setView(popupWebView)
                        .create()

                    activePopupDialog = dialog
                    dialog.show()

                    val transport = resultMsg?.obj as? WebView.WebViewTransport
                    transport?.webView = popupWebView
                    resultMsg?.sendToTarget()
                    return true
                }
            }

            loadUrl(serverUrl)
        }

        rootLayout.addView(webView)

        // Floating settings button (bottom-right) to change the server URL
        val settingsButton = ImageButton(this).apply {
            val size = (40 * resources.displayMetrics.density).toInt()
            layoutParams = FrameLayout.LayoutParams(size, size).apply {
                gravity = Gravity.BOTTOM or Gravity.END
                setMargins(0, 0, (16 * resources.displayMetrics.density).toInt(), (16 * resources.displayMetrics.density).toInt())
            }
            setBackgroundColor(Color.TRANSPARENT)
            setImageResource(android.R.drawable.ic_menu_preferences)
            alpha = 0.35f
            contentDescription = "Server URL Settings"
            setOnClickListener { showUrlConfigDialog() }
        }

        rootLayout.addView(settingsButton)
        setContentView(rootLayout)
    }

    private fun showUrlConfigDialog() {
        val sharedPrefs = getSharedPreferences("promptpilot_prefs", MODE_PRIVATE)
        val isEmulator = Build.FINGERPRINT.startsWith("generic") ||
            Build.FINGERPRINT.startsWith("unknown") ||
            Build.MODEL.contains("google_sdk", ignoreCase = true) ||
            Build.MODEL.contains("Emulator", ignoreCase = true) ||
            Build.MODEL.contains("Android SDK", ignoreCase = true) ||
            Build.MANUFACTURER.contains("Genymotion", ignoreCase = true) ||
            (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic")) ||
            Build.PRODUCT.startsWith("sdk") ||
            Build.HARDWARE == "goldfish" || Build.HARDWARE == "ranchu"
        val defaultUrl = "file:///android_asset/index.html"
        val currentUrl = sharedPrefs.getString("server_url", defaultUrl) ?: defaultUrl

        val input = EditText(this).apply {
            setText(currentUrl)
            setSingleLine(true)
            val padding = (16 * resources.displayMetrics.density).toInt()
            setPadding(padding, padding, padding, padding)
        }

        AlertDialog.Builder(this)
            .setTitle("Configure Backend Server URL")
            .setMessage("Set the address of your Render Cloud URL or local server:")
            .setView(input)
            .setPositiveButton("Save") { dialog, _ ->
                val newUrl = input.text.toString().trim()
                if (newUrl.isNotEmpty()) {
                    sharedPrefs.edit().putString("server_url", newUrl).apply()
                    webView.loadUrl(newUrl)
                }
                dialog.dismiss()
            }
            .setNeutralButton("Use Bundled App") { dialog, _ ->
                sharedPrefs.edit().putString("server_url", "file:///android_asset/index.html").apply()
                webView.loadUrl("file:///android_asset/index.html")
                dialog.dismiss()
            }
            .setNegativeButton("Cancel") { dialog, _ ->
                dialog.dismiss()
            }
            .show()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val data = intent.data
        if (data != null && (data.scheme == "promptpilot" || data.scheme == "spark")) {
            val sharedPrefs = getSharedPreferences("promptpilot_prefs", MODE_PRIVATE)
            val defaultUrl = "file:///android_asset/index.html"
            val serverUrl = sharedPrefs.getString("server_url", defaultUrl) ?: defaultUrl
            webView.loadUrl(serverUrl)
        }
    }

    override fun onResume() {
        super.onResume()
        CookieManager.getInstance().flush()
    }
}
