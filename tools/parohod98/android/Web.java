package com.win98clone.parohod98;

import android.app.Activity;
import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.net.Uri;
import android.os.Build;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import java.io.File;
import java.io.FileInputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class Web {
    static final String HOST = "appassets.androidplatform.net";
    static final String ORIGIN = "https://" + HOST;
    private static final Pattern RANGE = Pattern.compile("bytes=(\\d*)-(\\d*)");

    private Web() {}

    static void fullscreen(Activity a) {
        a.requestWindowFeature(Window.FEATURE_NO_TITLE);
        a.getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = a.getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            a.getWindow().setAttributes(lp);
        }
    }

    static WebView create(Context c) {
        WebView web = new WebView(c);
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
        return web;
    }

    static void hideBars(WebView web) {
        web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }

    static boolean ours(Uri url) {
        return url != null && HOST.equals(url.getHost());
    }

    static String mimeOf(String path) {
        String p = path.toLowerCase();
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".mp3")) return "audio/mpeg";
        if (p.endsWith(".ogg")) return "audio/ogg";
        if (p.endsWith(".wav")) return "audio/wav";
        if (p.endsWith(".mid")) return "audio/midi";
        if (p.endsWith(".ttf")) return "font/ttf";
        if (p.endsWith(".woff2")) return "font/woff2";
        return "application/octet-stream";
    }

    static WebResourceResponse status(int code, String reason) {
        return new WebResourceResponse("text/plain", "utf-8", code, reason, new HashMap<String, String>(), null);
    }

    interface Source {
        InputStream open(String path) throws IOException;

        long length(String path);
    }

    static Source assets(final Context c) {
        return new Source() {
            @Override
            public InputStream open(String path) throws IOException {
                return c.getAssets().open("www/" + path);
            }

            @Override
            public long length(String path) {
                try (AssetFileDescriptor fd = c.getAssets().openFd("www/" + path)) {
                    return fd.getLength();
                } catch (IOException e) {
                    return -1;
                }
            }
        };
    }

    static InputStream openFile(File f) throws IOException {
        if (f == null || !f.isFile()) throw new IOException("missing");
        return new FileInputStream(f);
    }

    static long fileLength(File f) {
        return f == null || !f.isFile() ? -1 : f.length();
    }

    static String pathOf(WebResourceRequest request) {
        Uri url = request.getUrl();
        if (!ours(url)) return null;
        String path = url.getPath() == null ? "" : url.getPath().replaceFirst("^/+", "");
        return path.isEmpty() ? "launcher/index.html" : path;
    }

    static WebResourceResponse serve(WebResourceRequest request, Source source) {
        String path = pathOf(request);
        if (path == null) return null;
        if (path.contains("..")) return status(403, "Forbidden");
        String mime = mimeOf(path);
        String charset = mime.startsWith("text/") || mime.endsWith("javascript") || mime.endsWith("json") ? "utf-8" : null;
        try {
            String range = header(request, "Range");
            long length = source.length(path);
            if (range != null && length >= 0) {
                Matcher m = RANGE.matcher(range);
                if (m.matches()) {
                    long from = m.group(1).isEmpty() ? Math.max(0, length - Long.parseLong(m.group(2))) : Long.parseLong(m.group(1));
                    long to = m.group(1).isEmpty() || m.group(2).isEmpty() ? length - 1 : Math.min(length - 1, Long.parseLong(m.group(2)));
                    if (from > to || from >= length) return status(416, "Range Not Satisfiable");
                    InputStream in = source.open(path);
                    skipFully(in, from);
                    Map<String, String> h = new HashMap<>();
                    h.put("Content-Range", "bytes " + from + "-" + to + "/" + length);
                    h.put("Content-Length", String.valueOf(to - from + 1));
                    h.put("Accept-Ranges", "bytes");
                    return new WebResourceResponse(mime, charset, 206, "Partial Content", h, new Limited(in, to - from + 1));
                }
            }
            InputStream in = source.open(path);
            Map<String, String> h = new HashMap<>();
            h.put("Accept-Ranges", "bytes");
            if (length >= 0) h.put("Content-Length", String.valueOf(length));
            return new WebResourceResponse(mime, charset, 200, "OK", h, in);
        } catch (IOException e) {
            return status(404, "Not Found");
        }
    }

    private static String header(WebResourceRequest request, String name) {
        Map<String, String> h = request.getRequestHeaders();
        if (h == null) return null;
        for (Map.Entry<String, String> e : h.entrySet()) if (name.equalsIgnoreCase(e.getKey())) return e.getValue();
        return null;
    }

    private static void skipFully(InputStream in, long n) throws IOException {
        while (n > 0) {
            long k = in.skip(n);
            if (k <= 0) {
                if (in.read() < 0) throw new IOException("short asset");
                k = 1;
            }
            n -= k;
        }
    }

    private static final class Limited extends FilterInputStream {
        private long left;

        Limited(InputStream in, long left) {
            super(in);
            this.left = left;
        }

        @Override
        public int read() throws IOException {
            if (left <= 0) return -1;
            int b = super.read();
            if (b >= 0) left--;
            return b;
        }

        @Override
        public int read(byte[] buf, int off, int len) throws IOException {
            if (left <= 0) return -1;
            int n = super.read(buf, off, (int) Math.min(len, left));
            if (n > 0) left -= n;
            return n;
        }
    }
}
