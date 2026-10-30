package com.win98clone.parohod98;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;

public class LauncherActivity extends Activity {
    static final String PREFS = "parohod98";
    private static final String START = Web.ORIGIN + "/launcher/index.html";
    private static final String BACK_JS = "window.parohod98Back?String(parohod98Back()):'false'";
    private static final String NOTIFY = "android.permission.POST_NOTIFICATIONS";
    private static final int REQ_NOTIFY = 51;
    private static final int REQ_SAVE = 52;
    private static final int REQ_OPEN = 53;
    private static final int OPEN_LIMIT = 32 * 1048576;
    private static final String ANY_FILE = "*" + "/" + "*";

    private WebView web;
    private App app;
    private Web.Source source;
    private volatile String pendingSave;
    private volatile String openedFile;
    private final App.Ui ui = js -> runOnUiThread(() -> {
        if (web != null) web.evaluateJavascript(js, null);
    });

    private class Bridge {
        @JavascriptInterface
        public String device() {
            return Device.info(LauncherActivity.this);
        }

        @JavascriptInterface
        public String memory() {
            return Device.memory(LauncherActivity.this);
        }

        @JavascriptInterface
        public String lastCrash() {
            SharedPreferences p = getSharedPreferences(PREFS, MODE_PRIVATE);
            String crash = p.getString("crash", "");
            p.edit().remove("crash").apply();
            return crash;
        }

        @JavascriptInterface
        public String state() {
            return app.state();
        }

        @JavascriptInterface
        public String notes() {
            return Json.write(app.store.notes());
        }

        @JavascriptInterface
        public void setMobile(String mode) {
            app.setMobile(mode);
        }

        @JavascriptInterface
        public void check() {
            app.check();
        }

        @JavascriptInterface
        public String network() {
            return app.network();
        }

        @JavascriptInterface
        public void download(String id, String parts, String mode) {
            app.download(id, parts, mode);
        }

        @JavascriptInterface
        public void pause(String id) {
            app.pause(id);
        }

        @JavascriptInterface
        public void resume(String id) {
            app.resume(id);
        }

        @JavascriptInterface
        public void cancel(String id) {
            app.cancel(id);
        }

        @JavascriptInterface
        public void remove(String id) {
            app.remove(id);
        }

        @JavascriptInterface
        public void removePart(String id, String part) {
            app.removePart(id, part);
        }

        @JavascriptInterface
        public void verify(String id) {
            app.verify(id);
        }

        @JavascriptInterface
        public void setChannel(String name) {
            app.setChannel(name);
            app.check();
        }

        @JavascriptInterface
        public String notifications() {
            if (Build.VERSION.SDK_INT < 33 || checkSelfPermission(NOTIFY) == PackageManager.PERMISSION_GRANTED) return "granted";
            return app.prefs().getString("notifications", "ask");
        }

        @JavascriptInterface
        public void askNotifications() {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT < 33) { app.call("notifications(true)"); return; }
                requestPermissions(new String[] { NOTIFY }, REQ_NOTIFY);
            });
        }

        @JavascriptInterface
        public void downloadApk() {
            app.apk.download();
        }

        @JavascriptInterface
        public void cancelApk() {
            app.apk.cancel();
        }

        @JavascriptInterface
        public void installApk() {
            runOnUiThread(() -> app.apk.install());
        }

        @JavascriptInterface
        public void openInstallSettings() {
            runOnUiThread(() -> app.apk.openSettings());
        }

        @JavascriptInterface
        public void openLink(final String url) {
            if (url == null || !(url.startsWith("https://pennygachi.men/") || url.equals("https://t.me/Penny_Gachimen"))) return;
            runOnUiThread(() -> {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                } catch (ActivityNotFoundException ignored) {
                    app.call("state('','link','')");
                }
            });
        }

        @JavascriptInterface
        public void play(final String game, final String query) {
            if (!app.canPlay(game)) {
                app.changed(game == null ? "" : game, "error", "missing:");
                return;
            }
            final String q = query == null ? "" : query.replaceAll("[^A-Za-z0-9=&_.-]", "");
            runOnUiThread(() -> {
                getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString("last", game).apply();
                startActivity(new Intent(LauncherActivity.this, GameActivity.class).putExtra("game", game).putExtra("query", q));
                finish();
            });
        }

        @JavascriptInterface
        public void saveFile(final String name, final String text) {
            pendingSave = text;
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json").putExtra(Intent.EXTRA_TITLE, name);
                try {
                    startActivityForResult(i, REQ_SAVE);
                } catch (ActivityNotFoundException e) {
                    pendingSave = null;
                    app.call("fileSaved(false)");
                }
            });
        }

        @JavascriptInterface
        public void openFile() {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(ANY_FILE);
                try {
                    startActivityForResult(i, REQ_OPEN);
                } catch (ActivityNotFoundException e) {
                    app.call("fileOpened('error')");
                }
            });
        }

        @JavascriptInterface
        public String takeFile() {
            String text = openedFile;
            openedFile = null;
            return text == null ? "" : text;
        }

        @JavascriptInterface
        public void vibrate(long ms) {
            Device.vibrate(LauncherActivity.this, ms);
        }
    }

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        app = App.get(this);
        Web.fullscreen(this);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        final Web.Source assets = Web.assets(this);
        source = new Web.Source() {
            @Override
            public InputStream open(String path) throws IOException {
                File f = picture(path);
                return f != null ? Web.openFile(f) : assets.open(path);
            }

            @Override
            public long length(String path) {
                File f = picture(path);
                return f != null ? Web.fileLength(f) : assets.length(path);
            }
        };
        web = Web.create(this);
        web.getSettings().setTextZoom(Math.round(Math.max(1f, Math.min(1.3f, getResources().getConfiguration().fontScale)) * 100));
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return Web.serve(request, source);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !Web.ours(request.getUrl());
            }

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                recreate();
                return true;
            }
        });
        web.addJavascriptInterface(new Bridge(), "Parohod98");
        setContentView(web);
        Web.hideBars(web);
        app.attach(ui);
        String from = getIntent().getStringExtra("from");
        web.loadUrl(START + (from == null || from.isEmpty() ? "" : "?from=" + Uri.encode(from)));
    }

    private File picture(String path) {
        if (!path.startsWith("pic/")) return null;
        String name = path.substring(4).replaceFirst("\\.(png|jpg)$", "");
        return app.store.picture(name);
    }

    @Override
    public void onRequestPermissionsResult(int request, String[] permissions, int[] results) {
        if (request != REQ_NOTIFY) return;
        boolean granted = results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED;
        app.prefs().edit().putString("notifications", granted ? "granted" : "denied").apply();
        app.call("notifications(" + granted + ")");
    }

    @Override
    protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        final Uri uri = result == RESULT_OK && data != null ? data.getData() : null;
        if (request == REQ_SAVE) {
            final String text = pendingSave;
            pendingSave = null;
            if (uri == null || text == null) { app.call("fileSaved(null)"); return; }
            new Thread(() -> app.call("fileSaved(" + writeDocument(uri, text) + ")")).start();
        } else if (request == REQ_OPEN) {
            if (uri == null) { app.call("fileOpened('none')"); return; }
            new Thread(() -> app.call("fileOpened('" + readDocument(uri) + "')")).start();
        }
    }

    private boolean writeDocument(Uri uri, String text) {
        try (OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
            if (out == null) return false;
            out.write(text.getBytes(StandardCharsets.UTF_8));
            return true;
        } catch (IOException | RuntimeException e) {
            return false;
        }
    }

    private String readDocument(Uri uri) {
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            if (in == null) return "error";
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[65536];
            int n;
            while ((n = in.read(buf)) > 0) {
                out.write(buf, 0, n);
                if (out.size() > OPEN_LIMIT) return "big";
            }
            openedFile = new String(out.toByteArray(), StandardCharsets.UTF_8);
            return "ok";
        } catch (IOException | RuntimeException e) {
            return "error";
        }
    }

    @Override
    public void onWindowFocusChanged(boolean focus) {
        super.onWindowFocusChanged(focus);
        if (focus) Web.hideBars(web);
    }

    @Override
    protected void onResume() {
        super.onResume();
        app.attach(ui);
        app.apk.permissionBack();
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript(BACK_JS, result -> {
            if (!"\"true\"".equals(result)) finish();
        });
    }

    @Override
    protected void onDestroy() {
        app.detach(ui);
        web.destroy();
        web = null;
        super.onDestroy();
    }
}
