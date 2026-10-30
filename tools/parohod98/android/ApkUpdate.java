package com.win98clone.parohod98;

import android.app.PendingIntent;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInstaller;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

final class ApkUpdate {
    private static final String ACTION_INSTALL = "com.win98clone.parohod98.INSTALL_STATUS";
    private static final long SPACE_MARGIN = 20L * 1048576;

    private final App app;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private volatile Fetch fetch;
    private volatile File file;
    private volatile String state = "idle";
    private volatile String detail = "";
    private volatile long done;
    private volatile long total;
    boolean waitingPermission;

    ApkUpdate(App app) {
        this.app = app;
        File[] old = dir().listFiles();
        if (old != null) for (File f : old) f.delete();
        IntentFilter filter = new IntentFilter(ACTION_INSTALL);
        BroadcastReceiver receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                int status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
                if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
                    Intent confirm = intent.getParcelableExtra(Intent.EXTRA_INTENT);
                    if (confirm == null) { set("error", "install"); return; }
                    confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    try {
                        app.startActivity(confirm);
                    } catch (ActivityNotFoundException e) {
                        set("error", "install");
                    }
                    return;
                }
                if (status == PackageInstaller.STATUS_SUCCESS) set("installed", "");
                else if (status == PackageInstaller.STATUS_FAILURE_ABORTED) set("ready", "aborted");
                else set("error", "install " + status);
            }
        };
        if (Build.VERSION.SDK_INT >= 33) app.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
        else app.registerReceiver(receiver, filter);
    }

    private File dir() {
        return new File(app.getCacheDir(), "update");
    }

    private void set(String s, String d) {
        state = s;
        detail = d == null ? "" : d;
        app.call("apk(" + Json.quote(state) + "," + Json.quote(detail) + ")");
    }

    Map<String, Object> state() {
        Map<String, Object> o = new LinkedHashMap<>();
        o.put("state", state);
        o.put("detail", detail);
        o.put("done", done);
        o.put("total", total);
        return o;
    }

    void download() {
        if ("downloading".equals(state)) return;
        Object raw = app.store.catalog() == null ? null : app.store.catalog().get("apk");
        if (!(raw instanceof Map)) { set("error", "no apk in the catalog"); return; }
        Map<String, Object> entry = Json.object(raw);
        final String name = Json.str(entry, "url"), sha = Json.str(entry, "sha256");
        final long bytes = Json.num(entry.get("bytes"));
        if (name == null || !name.matches("Parohod98-[0-9.]+\\.apk") || sha == null || !sha.matches("[0-9a-f]{64}")) { set("error", "bad apk entry"); return; }
        set("downloading", "");
        io.execute(() -> {
            File d = dir();
            d.mkdirs();
            long usable = d.getUsableSpace();
            if (usable < bytes + SPACE_MARGIN) { set("error", "space:" + (bytes + SPACE_MARGIN - usable)); return; }
            File out = new File(d, "Parohod98.apk");
            File part = new File(d, "Parohod98.apk.part");
            file = null;
            done = 0;
            total = bytes;
            Fetch f = new Fetch();
            fetch = f;
            try {
                f.blob(Config.UPDATE_BASE + Store.PRODUCT + "/" + name, part, out, bytes, false, sha, name, n -> {
                    done += n;
                    app.call("apkProgress(" + done + "," + total + ")");
                });
                file = out;
                set("ready", "");
            } catch (Fetch.Failure e) {
                if (e.code.equals("stopped")) set("idle", "");
                else set("error", e.code + ":" + e.detail);
            } finally {
                fetch = null;
            }
        });
    }

    void cancel() {
        Fetch f = fetch;
        if (f != null) f.abort();
    }

    void install() {
        final File apk = file;
        if (apk == null || !apk.exists()) { set("error", "missing"); return; }
        if (!app.getPackageManager().canRequestPackageInstalls()) { set("permission", ""); return; }
        set("installing", "");
        io.execute(() -> {
            try {
                PackageInstaller installer = app.getPackageManager().getPackageInstaller();
                PackageInstaller.SessionParams params = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
                params.setSize(apk.length());
                int id = installer.createSession(params);
                try (PackageInstaller.Session session = installer.openSession(id)) {
                    try (OutputStream o = session.openWrite("parohod98", 0, apk.length()); InputStream in = new FileInputStream(apk)) {
                        byte[] buf = new byte[65536];
                        for (int n; (n = in.read(buf)) > 0; ) o.write(buf, 0, n);
                        session.fsync(o);
                    }
                    Intent status = new Intent(ACTION_INSTALL).setPackage(app.getPackageName());
                    int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
                    session.commit(PendingIntent.getBroadcast(app, id, status, flags).getIntentSender());
                }
                set("waiting", "");
            } catch (IOException | RuntimeException e) {
                set("error", "install:" + e.getMessage());
            }
        });
    }

    void openSettings() {
        waitingPermission = true;
        try {
            app.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + app.getPackageName())).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        } catch (ActivityNotFoundException e) {
            waitingPermission = false;
            set("error", "settings");
        }
    }

    void permissionBack() {
        if (!waitingPermission) return;
        waitingPermission = false;
        if (app.getPackageManager().canRequestPackageInstalls()) install();
        else set("permission", "denied");
    }
}
