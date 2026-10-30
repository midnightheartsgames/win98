package com.win98clone.parohod98;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.ViewGroup;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class GameActivity extends Activity {
    private static final String BACK_JS = "window.parohod98Back?String(parohod98Back()):'false'";
    private static final String ESC_JS = "(function(){var t=document.activeElement||document.body;['keydown','keyup'].forEach(function(n){t.dispatchEvent(new KeyboardEvent(n,{code:'Escape',key:'Escape',bubbles:true,cancelable:true}));});})()";
    private static final String PAUSE_JS = "window.parohod98Pause&&parohod98Pause(%s)";

    private WebView web;
    private Web.Source source;
    private String game;
    private String query;
    private boolean leaving;
    private Tilt tilt;
    private Speech speech;

    private class Bridge {
        @JavascriptInterface
        public void exit() {
            runOnUiThread(GameActivity.this::toLauncher);
        }

        @JavascriptInterface
        public String info() {
            JSONObject o = new JSONObject();
            try {
                o.put("game", game);
                o.put("query", query);
                o.put("app", Device.appVersion(GameActivity.this));
                App app = App.get(GameActivity.this);
                o.put("channel", app.channel());
                Map<String, Object> inst = app.store.installed(game);
                o.put("version", inst == null ? "" : String.valueOf(inst.get("version")));
                o.put("parts", new JSONArray(inst == null || !(inst.get("parts") instanceof List) ? new ArrayList<Object>() : Json.array(inst.get("parts"))));
            } catch (JSONException e) {
                return "{}";
            }
            return o.toString();
        }

        @JavascriptInterface
        public String memory() {
            return Device.memory(GameActivity.this);
        }

        @JavascriptInterface
        public void vibrate(long ms) {
            Device.vibrate(GameActivity.this, ms);
        }

        @JavascriptInterface
        public String display() {
            return Device.display(GameActivity.this);
        }

        @JavascriptInterface
        public float tilt() {
            return tilt.angle();
        }

        @JavascriptInterface
        public boolean speechReady() {
            return speech.ready();
        }

        @JavascriptInterface
        public void speak(String id, String text, float pitch, float rate, float volume) {
            speech.speak(id, text, pitch, rate, volume);
        }

        @JavascriptInterface
        public String speechState(String id) {
            return speech.state(id);
        }

        @JavascriptInterface
        public void stopSpeech() {
            speech.stop();
        }
    }

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        Web.fullscreen(this);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        Device.preferFastest(this);
        game = getIntent().getStringExtra("game");
        query = getIntent().getStringExtra("query");
        final App app = App.get(this);
        if (game == null || !app.canPlay(game)) { game = null; toLauncher(); return; }
        app.gameStarted(game);
        tilt = new Tilt(this);
        speech = new Speech(this);
        final Web.Source assets = Web.assets(this);
        final String prefix = "games/" + game + "/";
        source = new Web.Source() {
            @Override
            public InputStream open(String path) throws IOException {
                File f = path.startsWith(prefix) ? app.served(game, path.substring(prefix.length())) : null;
                return f != null ? Web.openFile(f) : assets.open(path);
            }

            @Override
            public long length(String path) {
                File f = path.startsWith(prefix) ? app.served(game, path.substring(prefix.length())) : null;
                return f != null ? Web.fileLength(f) : assets.length(path);
            }
        };
        web = Web.create(this);
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
                JSONObject o = new JSONObject();
                try {
                    o.put("game", game);
                    o.put("query", query);
                    o.put("crashed", detail.didCrash());
                    o.put("priority", detail.rendererPriorityAtExit());
                    o.put("at", System.currentTimeMillis());
                    o.put("memory", new JSONObject(Device.memory(GameActivity.this)));
                } catch (JSONException e) {
                    o = new JSONObject();
                }
                getSharedPreferences(LauncherActivity.PREFS, MODE_PRIVATE).edit().putString("crash", o.toString()).commit();
                ViewGroup parent = (ViewGroup) web.getParent();
                if (parent != null) parent.removeView(web);
                web.destroy();
                web = null;
                toLauncher();
                return true;
            }
        });
        web.addJavascriptInterface(new Bridge(), "Parohod98Game");
        setContentView(web);
        Web.hideBars(web);
        web.loadUrl(Web.ORIGIN + "/games/" + game + "/index.html" + (query == null || query.isEmpty() ? "" : "?" + query));
    }

    private void toLauncher() {
        if (leaving) return;
        leaving = true;
        startActivity(new Intent(this, LauncherActivity.class).putExtra("from", game == null ? "" : game));
        finish();
    }

    @Override
    public void onWindowFocusChanged(boolean focus) {
        super.onWindowFocusChanged(focus);
        if (focus && web != null) Web.hideBars(web);
    }

    @Override
    public void onBackPressed() {
        if (web == null) { toLauncher(); return; }
        web.evaluateJavascript(BACK_JS, result -> {
            if (!"\"true\"".equals(result) && web != null) web.evaluateJavascript(ESC_JS, null);
        });
    }

    @Override
    protected void onPause() {
        if (tilt != null) tilt.pause();
        if (speech != null) speech.stop();
        if (web != null) {
            web.evaluateJavascript(String.format(PAUSE_JS, "true"), null);
            web.onPause();
        }
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (tilt != null) tilt.resume();
        if (web != null) {
            web.onResume();
            web.evaluateJavascript(String.format(PAUSE_JS, "false"), null);
            Web.hideBars(web);
        }
    }

    @Override
    protected void onDestroy() {
        if (game != null) App.get(this).gameClosed(game);
        if (speech != null) speech.shutdown();
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
