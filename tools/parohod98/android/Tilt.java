package com.win98clone.parohod98;

import android.app.Activity;
import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.view.Surface;

final class Tilt implements SensorEventListener {
    private final Activity activity;
    private final SensorManager sensors;
    private final Sensor sensor;
    private final boolean raw;
    private final float[] g = new float[3];
    private volatile float angle = Float.NaN;
    private volatile boolean wanted;
    private boolean listening;

    Tilt(Activity a) {
        activity = a;
        sensors = (SensorManager) a.getSystemService(Context.SENSOR_SERVICE);
        Sensor gravity = sensors == null ? null : sensors.getDefaultSensor(Sensor.TYPE_GRAVITY);
        raw = gravity == null;
        sensor = gravity != null ? gravity : sensors == null ? null : sensors.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
    }

    float angle() {
        if (!wanted) {
            wanted = true;
            activity.runOnUiThread(this::resume);
        }
        return sensor == null ? Float.NaN : angle;
    }

    void resume() {
        if (!wanted || listening || sensor == null) return;
        listening = sensors.registerListener(this, sensor, SensorManager.SENSOR_DELAY_GAME);
    }

    void pause() {
        if (!listening) return;
        sensors.unregisterListener(this);
        listening = false;
    }

    @Override
    public void onSensorChanged(SensorEvent e) {
        float k = raw ? 0.15f : 1f;
        for (int i = 0; i < 3; i++) g[i] += (e.values[i] - g[i]) * k;
        float sx, sy;
        switch (activity.getWindowManager().getDefaultDisplay().getRotation()) {
            case Surface.ROTATION_90: sx = g[1]; sy = -g[0]; break;
            case Surface.ROTATION_270: sx = -g[1]; sy = g[0]; break;
            case Surface.ROTATION_180: sx = -g[0]; sy = -g[1]; break;
            default: sx = g[0]; sy = g[1]; break;
        }
        angle = (float) Math.toDegrees(Math.atan2(-sx, sy));
    }

    @Override
    public void onAccuracyChanged(Sensor s, int accuracy) {
    }
}
