package com.win98clone.parohod98;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.drawable.Icon;
import android.os.Build;
import android.os.IBinder;

public class DownloadService extends Service {
    private static final String CHANNEL = "downloads";
    private static final int ID = 98;
    private static final String PAUSE = "com.win98clone.parohod98.PAUSE";
    private static final String CANCEL = "com.win98clone.parohod98.CANCEL";
    private static volatile boolean running;
    private static volatile DownloadService instance;
    private static volatile String title = "";
    private static volatile int percent;

    static void start(Context c) {
        if (running) return;
        running = true;
        try {
            c.startForegroundService(new Intent(c, DownloadService.class));
        } catch (RuntimeException e) {
            running = false;
        }
    }

    static void stop(Context c) {
        running = false;
        DownloadService s = instance;
        if (s != null) s.stopSelf();
    }

    static void update(Context c, String game, int pct) {
        title = game;
        percent = Math.max(0, Math.min(100, pct));
        if (!running) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.notify(ID, build(c));
    }

    private static Notification build(Context c) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        boolean ru = App.russian();
        if (nm != null && nm.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, ru ? "Загрузка игр" : "Game downloads", NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }
        Intent open = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        if (open == null) open = new Intent(c, LauncherActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        PendingIntent content = PendingIntent.getActivity(c, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        String text = (ru ? "Загрузка " : "Downloading ") + (title.isEmpty() ? "" : title + " · ") + percent + " %";
        return new Notification.Builder(c, CHANNEL)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle(ru ? "Пароход 98" : "Steamer 98")
            .setContentText(text)
            .setProgress(100, percent, title.isEmpty())
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(content)
            .addAction(action(c, PAUSE, android.R.drawable.ic_media_pause, ru ? "Пауза" : "Pause", 1))
            .addAction(action(c, CANCEL, android.R.drawable.ic_menu_close_clear_cancel, ru ? "Отмена" : "Cancel", 2))
            .build();
    }

    private static Notification.Action action(Context c, String name, int icon, String label, int code) {
        Intent i = new Intent(c, DownloadService.class).setAction(name);
        PendingIntent p = PendingIntent.getService(c, code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        return new Notification.Action.Builder(Icon.createWithResource(c, icon), label, p).build();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();
        instance = this;
        if (Build.VERSION.SDK_INT >= 29) startForeground(ID, build(this), ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        else startForeground(ID, build(this));
        if (PAUSE.equals(action)) App.get(this).pauseCurrent();
        else if (CANCEL.equals(action)) App.get(this).cancelCurrent();
        if (!running) stopSelf();
        return START_NOT_STICKY;
    }

    public void onTimeout(int startId, int type) {
        running = false;
        stopSelf();
    }

    @Override
    public void onDestroy() {
        running = false;
        instance = null;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
