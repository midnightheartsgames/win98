package com.win98clone.hsr98;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInstaller;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.IOException;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/index.html";
    private static final String KEY_JS = "(function(c){var g=document.getElementById('game');if(!g)return;['keydown','keyup'].forEach(function(t){g.dispatchEvent(new KeyboardEvent(t,{code:c,key:c,bubbles:true,cancelable:true}));});})";
    private static final String AUDIO_JS = "(function(on){var a=window.hsrui&&window.hsrui.audio;if(a&&a.ctx){if(on)a.ctx.resume();else a.ctx.suspend();}})";

    private static final int REQ_SAVE = 41;
    private static final int REQ_OPEN = 42;
    private static final String UPDATE_BASE = "https://pennygachi.men/web98/update/sr98/";
    private static final String ACTION_INSTALL = "com.win98clone.hsr98.INSTALL_STATUS";
    private static final long SPACE_MARGIN = 20L * 1048576;

    private WebView web;
    private String pendingSave;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private volatile boolean cancelDownload;
    private volatile File updateFile;
    private boolean waitingPermission;

    private final BroadcastReceiver installReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            int status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
            if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
                Intent confirm = intent.getParcelableExtra(Intent.EXTRA_INTENT);
                if (confirm == null) { callUi("updateResult(1)"); return; }
                confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                try {
                    startActivity(confirm);
                } catch (ActivityNotFoundException e) {
                    callUi("updateResult(1)");
                }
                return;
            }
            callUi("updateResult(" + status + ")");
        }
    };

    private class SavesBridge {
        @JavascriptInterface
        public void saveFile(final String name, final String text) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    pendingSave = text;
                    Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json").putExtra(Intent.EXTRA_TITLE, name);
                    if (!startPicker(i, REQ_SAVE)) { pendingSave = null; callUi("fileSaved(false)"); }
                }
            });
        }

        @JavascriptInterface
        public String versionCode() {
            try {
                return String.valueOf(getPackageManager().getPackageInfo(getPackageName(), 0).versionCode);
            } catch (PackageManager.NameNotFoundException e) {
                return "0";
            }
        }

        @JavascriptInterface
        public void checkUpdate(final String channel) {
            io.execute(new Runnable() {
                @Override
                public void run() {
                    String name = "test".equals(channel) ? "test" : "stable";
                    try {
                        String pointer = httpText(UPDATE_BASE + name + ".json?t=" + (System.currentTimeMillis() / 60000));
                        String notes = null;
                        try {
                            notes = httpText(UPDATE_BASE + "notes.json");
                        } catch (IOException e) {
                            notes = null;
                        }
                        String json = "{\"pointer\":" + pointer + ",\"notes\":" + (notes == null ? "null" : notes) + "}";
                        callUi("updateInfo(" + JSONObject.quote(json) + ")");
                    } catch (IOException e) {
                        callUi("updateError('offline'," + JSONObject.quote(String.valueOf(e.getMessage())) + ")");
                    }
                }
            });
        }

        @JavascriptInterface
        public void downloadUpdate(final String url, final String sha256, final String bytes) {
            io.execute(new Runnable() {
                @Override
                public void run() {
                    download(url, sha256, Long.parseLong(bytes));
                }
            });
        }

        @JavascriptInterface
        public void cancelUpdate() {
            cancelDownload = true;
        }

        @JavascriptInterface
        public void installUpdate() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    startInstall();
                }
            });
        }

        @JavascriptInterface
        public void openInstallSettings() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (Build.VERSION.SDK_INT < 26) return;
                    waitingPermission = true;
                    try {
                        startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName())));
                    } catch (ActivityNotFoundException e) {
                        waitingPermission = false;
                        callUi("updateError('error'," + JSONObject.quote("Настройки Android не открылись") + ")");
                    }
                }
            });
        }

        @JavascriptInterface
        public void openFile() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
                    if (!startPicker(i, REQ_OPEN)) callUi("fileOpened('')");
                }
            });
        }
    }

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_FULLSCREEN);
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }
        web = new WebView(this);
        web.setBackgroundColor(0xff000000);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setTextZoom(100);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return serve(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !HOST.equals(request.getUrl().getHost());
            }
        });
        web.addJavascriptInterface(new SavesBridge(), "Sr98Android");
        IntentFilter installFilter = new IntentFilter(ACTION_INSTALL);
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(installReceiver, installFilter, Context.RECEIVER_NOT_EXPORTED);
        else registerReceiver(installReceiver, installFilter);
        clearUpdates();
        setContentView(web);
        hideBars();
        web.loadUrl(START);
    }

    private WebResourceResponse serve(Uri url) {
        if (!HOST.equals(url.getHost())) return null;
        String path = url.getPath() == null ? "" : url.getPath().replaceFirst("^/+", "");
        if (path.isEmpty()) path = "index.html";
        if (path.contains("..")) return new WebResourceResponse("text/plain", "utf-8", 403, "Forbidden", null, null);
        try {
            InputStream in = getAssets().open("www/" + path);
            String mime = mimeOf(path);
            return new WebResourceResponse(mime, mime.startsWith("text/") || mime.endsWith("javascript") ? "utf-8" : null, in);
        } catch (IOException e) {
            return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, null);
        }
    }

    private static String mimeOf(String path) {
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".js")) return "application/javascript";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".mp3")) return "audio/mpeg";
        if (path.endsWith(".mid")) return "audio/midi";
        return "application/octet-stream";
    }

    private boolean startPicker(Intent intent, int request) {
        try {
            startActivityForResult(intent, request);
            return true;
        } catch (ActivityNotFoundException e) {
            return false;
        }
    }

    private void callUi(final String call) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                web.evaluateJavascript("window.hsrui&&window.hsrui." + call, null);
            }
        });
    }

    private String httpText(String url) throws IOException {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(20000);
        c.setUseCaches(false);
        try {
            int code = c.getResponseCode();
            if (code != 200) throw new IOException("HTTP " + code);
            try (InputStream in = c.getInputStream()) {
                return new String(readAll(in), StandardCharsets.UTF_8);
            }
        } finally {
            c.disconnect();
        }
    }

    private File updateDir() {
        return new File(getCacheDir(), "update");
    }

    private void clearUpdates() {
        File[] old = updateDir().listFiles();
        if (old != null) for (File f : old) f.delete();
    }

    private void download(String url, String sha256, long bytes) {
        if (!url.startsWith(UPDATE_BASE)) { callUi("updateError('error'," + JSONObject.quote("Чужой адрес обновления") + ")"); return; }
        File dir = updateDir();
        dir.mkdirs();
        long usable = dir.getUsableSpace();
        if (usable < bytes + SPACE_MARGIN) { callUi("updateError('space'," + JSONObject.quote(String.valueOf(bytes + SPACE_MARGIN - usable)) + ")"); return; }
        File out = new File(dir, "StarRail98.apk");
        cancelDownload = false;
        updateFile = null;
        HttpURLConnection c = null;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(15000);
            c.setReadTimeout(30000);
            int code = c.getResponseCode();
            if (code != 200) throw new IOException("HTTP " + code);
            long done = 0, shown = 0;
            try (InputStream in = c.getInputStream(); OutputStream o = new FileOutputStream(out)) {
                byte[] buf = new byte[65536];
                for (int n; (n = in.read(buf)) > 0; ) {
                    if (cancelDownload) break;
                    o.write(buf, 0, n);
                    md.update(buf, 0, n);
                    done += n;
                    long now = System.currentTimeMillis();
                    if (now - shown > 200) { shown = now; callUi("updateProgress(" + done + "," + bytes + ")"); }
                }
            }
            if (cancelDownload) { out.delete(); return; }
            StringBuilder hex = new StringBuilder();
            for (byte b : md.digest()) hex.append(String.format("%02x", b));
            if (done != bytes || !hex.toString().equals(sha256)) { out.delete(); callUi("updateError('corrupt')"); return; }
            updateFile = out;
            callUi("updateProgress(" + done + "," + bytes + ")");
            callUi("updateReady()");
        } catch (IOException | NoSuchAlgorithmException e) {
            out.delete();
            callUi("updateError('offline'," + JSONObject.quote(String.valueOf(e.getMessage())) + ")");
        } finally {
            if (c != null) c.disconnect();
        }
    }

    private void startInstall() {
        final File file = updateFile;
        if (file == null || !file.exists()) { callUi("updateError('error'," + JSONObject.quote("Файл обновления не найден, скачайте его снова") + ")"); return; }
        if (Build.VERSION.SDK_INT >= 26 && !getPackageManager().canRequestPackageInstalls()) { callUi("updateNeedsPermission()"); return; }
        io.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    PackageInstaller installer = getPackageManager().getPackageInstaller();
                    PackageInstaller.SessionParams params = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
                    params.setSize(file.length());
                    int id = installer.createSession(params);
                    PackageInstaller.Session session = installer.openSession(id);
                    try (OutputStream o = session.openWrite("sr98", 0, file.length()); InputStream in = new FileInputStream(file)) {
                        byte[] buf = new byte[65536];
                        for (int n; (n = in.read(buf)) > 0; ) o.write(buf, 0, n);
                        session.fsync(o);
                    }
                    Intent status = new Intent(ACTION_INSTALL).setPackage(getPackageName());
                    int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
                    PendingIntent pending = PendingIntent.getBroadcast(MainActivity.this, id, status, flags);
                    session.commit(pending.getIntentSender());
                    session.close();
                    callUi("updateWaiting()");
                } catch (IOException | RuntimeException e) {
                    callUi("updateError('error'," + JSONObject.quote(String.valueOf(e.getMessage())) + ")");
                }
            }
        });
    }

    @Override
    protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        Uri uri = result == RESULT_OK && data != null ? data.getData() : null;
        if (request == REQ_SAVE && pendingSave != null) {
            String text = pendingSave;
            pendingSave = null;
            if (uri != null) callUi("fileSaved(" + writeText(uri, text) + ")");
        }
        if (request == REQ_OPEN && uri != null) callUi("fileOpened(" + JSONObject.quote(readText(uri)) + ")");
    }

    private boolean writeText(Uri uri, String text) {
        try (OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
            if (out == null) return false;
            out.write(text.getBytes(StandardCharsets.UTF_8));
            return true;
        } catch (IOException | SecurityException e) {
            return false;
        }
    }

    private String readText(Uri uri) {
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            if (in == null) return "";
            return new String(readAll(in), StandardCharsets.UTF_8);
        } catch (IOException | SecurityException e) {
            return "";
        }
    }

    private static byte[] readAll(InputStream in) throws IOException {
        ByteArrayOutputStream buf = new ByteArrayOutputStream();
        byte[] chunk = new byte[65536];
        for (int n; (n = in.read(chunk)) > 0; ) buf.write(chunk, 0, n);
        return buf.toByteArray();
    }

    private void hideBars() {
        web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }

    @Override
    public void onWindowFocusChanged(boolean focus) {
        super.onWindowFocusChanged(focus);
        if (focus) hideBars();
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript(KEY_JS + "('Escape')", null);
    }

    @Override
    protected void onPause() {
        web.evaluateJavascript(AUDIO_JS + "(false)", null);
        web.onPause();
        web.pauseTimers();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        web.resumeTimers();
        web.evaluateJavascript(AUDIO_JS + "(true)", null);
        hideBars();
        if (waitingPermission) {
            waitingPermission = false;
            boolean allowed = Build.VERSION.SDK_INT < 26 || getPackageManager().canRequestPackageInstalls();
            callUi("updatePermissionBack(" + allowed + ")");
        }
    }

    @Override
    protected void onDestroy() {
        unregisterReceiver(installReceiver);
        io.shutdownNow();
        web.destroy();
        super.onDestroy();
    }
}
