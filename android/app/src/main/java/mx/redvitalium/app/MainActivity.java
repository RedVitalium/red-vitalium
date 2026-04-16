package mx.redvitalium.app;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = getBridge().getWebView();
                webView.evaluateJavascript(
                    "(function() {" +
                    "  var path = window.location.pathname;" +
                    "  if (path === '/home' || path === '/auth' || path === '/') {" +
                    "    return 'minimize';" +
                    "  } else if (path.startsWith('/dashboard/')) {" +
                    "    window.location.href = '/my-dashboard';" +
                    "    return 'navigated';" +
                    "  } else if (path.startsWith('/professional/')) {" +
                    "    window.location.href = '/professional';" +
                    "    return 'navigated';" +
                    "  } else if (path === '/admin/select-patient') {" +
                    "    window.location.href = '/admin';" +
                    "    return 'navigated';" +
                    "  } else {" +
                    "    window.location.href = '/home';" +
                    "    return 'navigated';" +
                    "  }" +
                    "})()",
                    result -> {
                        if (result != null && result.contains("minimize")) {
                            moveTaskToBack(true);
                        }
                    }
                );
            }
        });
    }
}