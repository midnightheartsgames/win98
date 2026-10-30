package com.win98clone.parohod98;

import android.app.Application;
import android.content.Context;
import android.content.SharedPreferences;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class App extends Application {
    static final long MOBILE_ASK = 25L * 1048576;

    interface Ui {
        void call(String js);
    }

    Store store;
    ApkUpdate apk;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private volatile Ui ui;
    private volatile String current;
    private volatile String playing;
    private volatile long sentAt;
    private volatile long noticeAt;
    private final ArrayDeque<long[]> samples = new ArrayDeque<>();
    private volatile long speed;
    private volatile boolean checking;

    static App get(Context c) {
        return (App) c.getApplicationContext();
    }

    @Override
    public void onCreate() {
        super.onCreate();
        store = new Store(getFilesDir(), Config.PUBLIC_KEY, Config.UPDATE_BASE, Device.versionName(this));
        apk = new ApkUpdate(this);
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm != null) cm.registerDefaultNetworkCallback(new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(Network n) {
                networkBack();
            }

            @Override
            public void onCapabilitiesChanged(Network n, NetworkCapabilities caps) {
                networkBack();
            }

            @Override
            public void onLost(Network n) {
                changed("", "network", network());
            }
        });
        io.execute(() -> {
            seed();
            store.cleanup();
            pump();
        });
    }

    private void seed() {
        if (new File(getFilesDir(), "catalog.json").exists()) return;
        try {
            Map<String, byte[]> pictures = new LinkedHashMap<>();
            String[] names = getAssets().list("bundled");
            if (names == null) return;
            for (String n : names) if (n.matches("[0-9a-f]{64}")) pictures.put(n, asset("bundled/" + n));
            store.seed(asset("bundled/catalog.json"), new String(asset("bundled/catalog.json.sig"), StandardCharsets.UTF_8), pictures);
        } catch (IOException ignored) {
        }
    }

    private byte[] asset(String name) throws IOException {
        try (InputStream in = getAssets().open(name)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[65536];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            return out.toByteArray();
        }
    }

    SharedPreferences prefs() {
        return getSharedPreferences(LauncherActivity.PREFS, MODE_PRIVATE);
    }

    String channel() {
        return "test".equals(prefs().getString("channel", "stable")) ? "test" : "stable";
    }

    void setChannel(String name) {
        prefs().edit().putString("channel", "test".equals(name) ? "test" : "stable").apply();
    }

    String mobile() {
        String m = prefs().getString("mobile", "ask");
        return "always".equals(m) || "never".equals(m) ? m : "ask";
    }

    void setMobile(String mode) {
        prefs().edit().putString("mobile", "always".equals(mode) || "never".equals(mode) ? mode : "ask").apply();
    }

    void attach(Ui u) {
        ui = u;
    }

    void detach(Ui u) {
        if (ui == u) ui = null;
    }

    void call(String js) {
        Ui u = ui;
        if (u != null) u.call("window.parohod98ui&&parohod98ui." + js);
    }

    void changed(String id, String state, String detail) {
        call("state(" + Json.quote(id) + "," + Json.quote(state) + "," + Json.quote(detail == null ? "" : detail) + ")");
    }

    String network() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        Network n = cm == null ? null : cm.getActiveNetwork();
        NetworkCapabilities c = n == null ? null : cm.getNetworkCapabilities(n);
        if (c == null || !c.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)) return "none";
        if (c.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) || c.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) return "wifi";
        if (c.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED)) return "wifi";
        return "mobile";
    }

    private void networkBack() {
        if ("none".equals(network())) return;
        io.execute(() -> {
            for (String id : store.jobs()) {
                Map<String, Object> job = store.job(id);
                if (job != null && "offline".equals(Json.str(job, "error"))) {
                    try {
                        store.mark(id, "error", null);
                        store.mark(id, "paused", false);
                    } catch (Fetch.Failure ignored) {
                        continue;
                    }
                }
            }
            pump();
        });
        changed("", "network", network());
    }

    String state() {
        Map<String, Object> s = store.state();
        s.put("channel", channel());
        s.put("network", network());
        s.put("current", current);
        s.put("playing", playing);
        s.put("speed", speed);
        s.put("checking", checking);
        Map<String, Object> app = new LinkedHashMap<>();
        app.put("versionName", Device.versionName(this));
        app.put("versionCode", Device.versionCode(this));
        app.put("update", apk.state());
        s.put("app", app);
        s.put("notifications", prefs().getString("notifications", "ask"));
        s.put("mobile", mobile());
        s.put("last", prefs().getString("last", ""));
        return Json.write(s);
    }

    void check() {
        if (checking) return;
        checking = true;
        io.execute(() -> {
            try {
                Map<String, Object> c = store.check(channel());
                checking = false;
                call("catalog(" + Json.quote(Json.write(c)) + ")");
                if (store.pictures(c) > 0) changed("", "pictures", "");
                if (store.notes(c) > 0) changed("", "notes", "");
                store.updates(c);
                changed("", "updates", "");
            } catch (Fetch.Failure f) {
                checking = false;
                call("offline(" + Json.quote(f.code) + "," + Json.quote(f.detail) + ")");
            }
        });
    }

    void download(final String id, final String parts, final String mode) {
        if (!Store.validId(id)) return;
        io.execute(() -> {
            List<String> list = new ArrayList<>();
            if (parts != null && !parts.isEmpty()) list.addAll(Arrays.asList(parts.split(",")));
            try {
                boolean onMobile = "mobile".equals(network()), asked = mode != null && !mode.isEmpty();
                boolean wifi = "wifi".equals(mode) || (!asked && onMobile && "never".equals(mobile()));
                Map<String, Object> job = store.plan(id, list, wifi);
                long need = Json.num(job.get("need"));
                if (!asked && !wifi && onMobile && "ask".equals(mobile()) && need > MOBILE_ASK) {
                    store.cancel(id);
                    call("ask(" + Json.quote(id) + "," + Json.quote(parts == null ? "" : parts) + "," + need + ")");
                    return;
                }
                changed(id, "queued", "");
                pump();
            } catch (Fetch.Failure f) {
                changed(id, "error", f.code + ":" + f.detail);
            }
        });
    }

    void pause(String id) {
        io.execute(() -> {
            try {
                store.mark(id, "paused", true);
            } catch (Fetch.Failure ignored) {
                return;
            }
            store.stop(id);
            changed(id, "paused", "");
        });
    }

    void resume(String id) {
        io.execute(() -> {
            try {
                store.mark(id, "error", null);
                store.mark(id, "paused", false);
            } catch (Fetch.Failure ignored) {
                return;
            }
            changed(id, "queued", "");
            pump();
        });
    }

    void cancel(String id) {
        io.execute(() -> {
            store.cancel(id);
            changed(id, "cancelled", "");
            pump();
        });
    }

    void pauseCurrent() {
        String id = current;
        if (id != null) pause(id);
    }

    void cancelCurrent() {
        String id = current;
        if (id != null) cancel(id);
    }

    void remove(String id) {
        io.execute(() -> {
            store.remove(id);
            changed(id, "removed", "");
        });
    }

    void removePart(String id, String part) {
        io.execute(() -> {
            try {
                store.dropPart(id, part);
                changed(id, "ready", "");
            } catch (Fetch.Failure f) {
                changed(id, "error", f.code + ":" + f.detail);
            }
        });
    }

    void verify(String id) {
        io.execute(() -> {
            changed(id, "verifying", "");
            List<String> damaged = store.verify(id);
            call("verified(" + Json.quote(id) + "," + Json.quote(Json.write(damaged)) + ")");
        });
    }

    boolean canPlay(String id) {
        if (!Store.validId(id)) return false;
        if (store.installed(id) != null) return store.missing(id) == 0;
        try {
            getAssets().open("www/games/" + id + "/index.html").close();
            return true;
        } catch (java.io.IOException e) {
            return false;
        }
    }

    File served(String id, String rel) {
        return store.installed(id) == null ? null : store.file(id, rel);
    }

    void gameStarted(String id) {
        playing = id;
    }

    void gameClosed(String id) {
        if (id != null && id.equals(playing)) playing = null;
        io.execute(this::pump);
    }

    String playing() {
        return playing;
    }

    private synchronized void pump() {
        if (current != null) return;
        for (String id : store.jobs()) {
            Map<String, Object> job = store.job(id);
            if (job == null || Boolean.TRUE.equals(job.get("paused"))) continue;
            if (store.ready(id)) {
                if (id.equals(playing)) continue;
                try {
                    store.install(id);
                    changed(id, "ready", "");
                } catch (Fetch.Failure f) {
                    changed(id, "error", f.code + ":" + f.detail);
                }
                continue;
            }
            if (Boolean.TRUE.equals(job.get("wifi")) && !"wifi".equals(network())) continue;
            current = id;
            DownloadService.start(this);
            worker.execute(() -> run(id));
            return;
        }
        DownloadService.stop(this);
    }

    private void run(String id) {
        String title = titleOf(id);
        synchronized (samples) {
            samples.clear();
        }
        speed = 0;
        changed(id, "downloading", "");
        try {
            store.download(id, (done, total) -> progress(id, title, done, total, false));
            long[] p = store.progress(id);
            progress(id, title, p[0], p[1], true);
            if (id.equals(playing)) changed(id, "waiting", "");
            else {
                store.install(id);
                changed(id, "ready", "");
            }
        } catch (Fetch.Failure f) {
            if (!f.code.equals("stopped")) failed(id, f);
        } finally {
            current = null;
            speed = 0;
            io.execute(this::pump);
        }
    }

    private void failed(String id, Fetch.Failure f) {
        try {
            store.mark(id, "error", f.code);
            store.mark(id, "detail", f.detail);
            store.mark(id, "paused", true);
        } catch (Fetch.Failure w) {
            changed(id, "error", w.code + ":" + w.detail);
            return;
        }
        changed(id, "error", f.code + ":" + f.detail);
    }

    private void progress(String id, String title, long done, long total, boolean force) {
        long now = System.currentTimeMillis();
        synchronized (samples) {
            samples.addLast(new long[] { now, done });
            while (samples.size() > 1 && now - samples.peekFirst()[0] > 3000) samples.removeFirst();
            long[] first = samples.peekFirst();
            speed = now > first[0] ? Math.max(0, (done - first[1]) * 1000 / (now - first[0])) : 0;
        }
        if (force || now - sentAt >= 200) {
            sentAt = now;
            call("progress(" + Json.quote(id) + "," + done + "," + total + "," + speed + ")");
        }
        if (force || now - noticeAt >= 1000) {
            noticeAt = now;
            DownloadService.update(this, title, total > 0 ? (int) (done * 100 / total) : 0);
        }
    }

    String titleOf(String id) {
        Object g = Store.games(store.catalog()).get(id);
        String t = g instanceof Map ? Json.str(Json.object(g), "title") : null;
        return t == null ? id : t;
    }

    static boolean russian() {
        return "ru".equals(Locale.getDefault().getLanguage());
    }
}
