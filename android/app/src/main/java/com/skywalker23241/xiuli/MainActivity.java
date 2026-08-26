package com.skywalker23241.xiuli;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(WebDavPlugin.class);
        super.onCreate(savedInstanceState);

        // Android 15/16 forces targetSdk 35+ activities edge-to-edge. HyperOS can
        // consume the insets before they reach a WebView, so listen on the Activity
        // content root and resize the WebView with real margins instead of relying
        // on WebView padding or CSS env() alone.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        View contentRoot = findViewById(android.R.id.content);
        View webView = getBridge().getWebView();

        boolean isDarkMode = (getResources().getConfiguration().uiMode
            & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        int systemBarSurface = Color.parseColor(isDarkMode ? "#171411" : "#f6f3ed");
        contentRoot.setBackgroundColor(systemBarSurface);
        getWindow().setStatusBarColor(systemBarSurface);
        getWindow().setNavigationBarColor(systemBarSurface);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), contentRoot);
        controller.setAppearanceLightStatusBars(!isDarkMode);
        controller.setAppearanceLightNavigationBars(!isDarkMode);

        ViewCompat.setOnApplyWindowInsetsListener(contentRoot, (view, insets) -> {
            Insets safeArea = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );

            int safeTop = safeArea.top;
            if (safeTop == 0 && insets.isVisible(WindowInsetsCompat.Type.statusBars())) {
                safeTop = getStatusBarHeight();
            }

            ViewGroup.MarginLayoutParams params = (ViewGroup.MarginLayoutParams) webView.getLayoutParams();
            if (params.leftMargin != safeArea.left
                || params.topMargin != safeTop
                || params.rightMargin != safeArea.right
                || params.bottomMargin != safeArea.bottom) {
                params.setMargins(safeArea.left, safeTop, safeArea.right, safeArea.bottom);
                webView.setLayoutParams(params);
            }
            return insets;
        });
        contentRoot.post(() -> ViewCompat.requestApplyInsets(contentRoot));
    }

    private int getStatusBarHeight() {
        int resourceId = getResources().getIdentifier("status_bar_height", "dimen", "android");
        return resourceId > 0 ? getResources().getDimensionPixelSize(resourceId) : 0;
    }
}
