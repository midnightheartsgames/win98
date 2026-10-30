package com.win98clone.parohod98;

import android.content.Context;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

final class Speech implements TextToSpeech.OnInitListener {
    private final Context context;
    private final Map<String, String> states = new ConcurrentHashMap<>();
    private TextToSpeech tts;
    private volatile boolean ready;
    private volatile boolean failed;

    Speech(Context c) {
        context = c.getApplicationContext();
    }

    synchronized boolean ready() {
        if (failed) return false;
        if (tts == null) tts = new TextToSpeech(context, this);
        return ready;
    }

    @Override
    public void onInit(int status) {
        if (status != TextToSpeech.SUCCESS || tts.setLanguage(new Locale("ru", "RU")) < TextToSpeech.LANG_AVAILABLE) {
            failed = true;
            return;
        }
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override
            public void onStart(String id) {
                states.put(id, "start");
            }

            @Override
            public void onDone(String id) {
                states.put(id, "done");
            }

            @Override
            public void onError(String id) {
                states.put(id, "done");
            }

            @Override
            public void onStop(String id, boolean interrupted) {
                states.put(id, "done");
            }
        });
        ready = true;
    }

    void speak(String id, String text, float pitch, float rate, float volume) {
        if (!ready || id == null || text == null) return;
        states.clear();
        states.put(id, "wait");
        tts.setPitch(pitch);
        tts.setSpeechRate(rate);
        Bundle params = new Bundle();
        params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, volume);
        if (tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, id) != TextToSpeech.SUCCESS) states.put(id, "done");
    }

    String state(String id) {
        String s = states.get(id);
        return s == null ? "done" : s;
    }

    void stop() {
        if (ready) tts.stop();
    }

    synchronized void shutdown() {
        if (tts != null) tts.shutdown();
        tts = null;
        ready = false;
    }
}
