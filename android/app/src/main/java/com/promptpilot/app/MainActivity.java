package com.promptpilot.app;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Manually register the plugin before super.onCreate
        registerPlugin(SocialLoginPlugin.class);

        super.onCreate(savedInstanceState);

        // Enable cookies (including third‑party) for the Capacitor WebView
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        
        // This is a requirement for the SocialLogin plugin to know you've updated the file
        IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin();
        
        WebView webView = this.getBridge().getWebView();
        if (webView != null) {
            cookieManager.setAcceptThirdPartyCookies(webView, true);
        }
    }

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {
        // Implementation required by the plugin's interface
    }
}
