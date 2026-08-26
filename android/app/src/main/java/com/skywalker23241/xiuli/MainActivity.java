package com.skywalker23241.xiuli;

import android.os.Bundle;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Android 15+ draws targetSdk 35+ apps edge-to-edge by default. Apply the
        // real system-bar and display-cutout insets to the WebView so the app UI
        // never sits underneath a status bar, camera cutout, or gesture area.
        // Keep the normal system-bar fitting behavior on Android 15 devices.
        // The theme opts out of forced edge-to-edge for this WebView shell; the
        // listener below remains as a fallback for devices that still dispatch
        // edge-to-edge insets.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        View webView = getBridge().getWebView();
        ViewCompat.setOnApplyWindowInsetsListener(webView, (view, insets) -> {
            Insets systemBars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            view.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });
        ViewCompat.requestApplyInsets(webView);
    }
}
