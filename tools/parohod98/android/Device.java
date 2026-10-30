package com.win98clone.parohod98;

import android.app.ActivityManager;
import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Vibrator;
import android.app.Activity;
import android.util.DisplayMetrics;
import android.view.Display;
import android.view.WindowManager;
import org.json.JSONArray;
import android.webkit.WebView;
import org.json.JSONException;
import org.json.JSONObject;

final class Device {
    private Device() {}

    static String memory(Context c) {
        ActivityManager am = (ActivityManager) c.getSystemService(Context.ACTIVITY_SERVICE);
        ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
        am.getMemoryInfo(mi);
        JSONObject o = new JSONObject();
        try {
            o.put("totalMB", mi.totalMem / 1048576);
            o.put("availMB", mi.availMem / 1048576);
            o.put("thresholdMB", mi.threshold / 1048576);
            o.put("low", mi.lowMemory);
            o.put("lowRam", am.isLowRamDevice());
        } catch (JSONException e) {
            return "{}";
        }
        return o.toString();
    }

    static String info(Context c) {
        JSONObject o = new JSONObject();
        try {
            ActivityManager am = (ActivityManager) c.getSystemService(Context.ACTIVITY_SERVICE);
            DisplayMetrics dm = c.getResources().getDisplayMetrics();
            o.put("maker", Build.MANUFACTURER);
            o.put("model", Build.MODEL);
            o.put("device", Build.DEVICE);
            o.put("android", Build.VERSION.RELEASE);
            o.put("sdk", Build.VERSION.SDK_INT);
            o.put("abi", Build.SUPPORTED_ABIS.length > 0 ? Build.SUPPORTED_ABIS[0] : "");
            o.put("memoryClassMB", am.getMemoryClass());
            o.put("largeMemoryClassMB", am.getLargeMemoryClass());
            o.put("lowRamDevice", am.isLowRamDevice());
            o.put("widthPx", dm.widthPixels);
            o.put("heightPx", dm.heightPixels);
            o.put("density", dm.density);
            o.put("dpi", dm.densityDpi);
            PackageInfo wv = WebView.getCurrentWebViewPackage();
            o.put("webview", wv == null ? "" : wv.packageName + " " + wv.versionName);
            o.put("app", appVersion(c));
            o.put("memory", new JSONObject(memory(c)));
        } catch (JSONException e) {
            return "{}";
        }
        return o.toString();
    }

    static String appVersion(Context c) {
        try {
            PackageInfo p = c.getPackageManager().getPackageInfo(c.getPackageName(), 0);
            return p.versionName + " (" + p.versionCode + ")";
        } catch (PackageManager.NameNotFoundException e) {
            return "";
        }
    }

    static String versionName(Context c) {
        try {
            return c.getPackageManager().getPackageInfo(c.getPackageName(), 0).versionName;
        } catch (PackageManager.NameNotFoundException e) {
            return "";
        }
    }

    static long versionCode(Context c) {
        try {
            return c.getPackageManager().getPackageInfo(c.getPackageName(), 0).versionCode;
        } catch (PackageManager.NameNotFoundException e) {
            return 0;
        }
    }

    static Display.Mode fastestMode(Activity a) {
        Display d = a.getWindowManager().getDefaultDisplay();
        Display.Mode cur = d.getMode(), best = cur;
        for (Display.Mode m : d.getSupportedModes()) {
            if (m.getPhysicalWidth() != cur.getPhysicalWidth() || m.getPhysicalHeight() != cur.getPhysicalHeight()) continue;
            if (m.getRefreshRate() > best.getRefreshRate() + 0.5f) best = m;
        }
        return best;
    }

    static void preferFastest(Activity a) {
        Display.Mode best = fastestMode(a);
        WindowManager.LayoutParams lp = a.getWindow().getAttributes();
        lp.preferredDisplayModeId = best.getModeId();
        lp.preferredRefreshRate = best.getRefreshRate();
        a.getWindow().setAttributes(lp);
    }

    static String display(Activity a) {
        JSONObject o = new JSONObject();
        try {
            Display d = a.getWindowManager().getDefaultDisplay();
            JSONArray modes = new JSONArray();
            for (Display.Mode m : d.getSupportedModes()) modes.put(m.getPhysicalWidth() + "x" + m.getPhysicalHeight() + "@" + Math.round(m.getRefreshRate()));
            o.put("refresh", Math.round(d.getRefreshRate()));
            o.put("mode", d.getMode().getPhysicalWidth() + "x" + d.getMode().getPhysicalHeight() + "@" + Math.round(d.getMode().getRefreshRate()));
            o.put("fastest", Math.round(fastestMode(a).getRefreshRate()));
            o.put("requested", a.getWindow().getAttributes().preferredDisplayModeId);
            o.put("modes", modes);
        } catch (JSONException e) {
            return "{}";
        }
        return o.toString();
    }

    static void vibrate(Context c, long ms) {
        Vibrator v = (Vibrator) c.getSystemService(Context.VIBRATOR_SERVICE);
        if (v != null && v.hasVibrator() && ms > 0) v.vibrate(android.os.VibrationEffect.createOneShot(Math.min(ms, 400), android.os.VibrationEffect.DEFAULT_AMPLITUDE));
    }
}
