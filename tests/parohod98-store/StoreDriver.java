package com.win98clone.parohod98;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

public final class StoreDriver {
    private StoreDriver() {}

    public static void main(String[] a) {
        Store store = new Store(new File(a[0]), a[2], a[1], a[3]);
        String retry = System.getenv("STORE_RETRY");
        if (retry != null) store.retryDelays = Arrays.stream(retry.split(",")).filter(s -> !s.isEmpty()).mapToInt(Integer::parseInt).toArray();
        String free = System.getenv("STORE_FREE");
        if (free != null) store.free = () -> Long.parseLong(free);
        String cmd = a[4];
        Map<String, Object> out = new LinkedHashMap<>();
        try {
            out.put("result", run(store, cmd, Arrays.copyOfRange(a, 5, a.length)));
            out.put("ok", true);
        } catch (Fetch.Failure f) {
            out.put("ok", false);
            out.put("code", f.code);
            out.put("detail", f.detail);
        }
        System.out.println(Json.write(out));
    }

    private static List<String> parts(String[] a, int i) {
        List<String> p = new ArrayList<>();
        if (a.length > i && !a[i].isEmpty()) p.addAll(Arrays.asList(a[i].split(",")));
        return p;
    }

    private static Object run(Store store, String cmd, String[] a) throws Fetch.Failure {
        try {
            return command(store, cmd, a);
        } catch (java.io.IOException e) {
            throw new Fetch.Failure("write", e.getMessage());
        }
    }

    private static Object command(Store store, String cmd, String[] a) throws Fetch.Failure, java.io.IOException {
        switch (cmd) {
            case "check": {
                Map<String, Object> c = store.check(a[0]);
                store.pictures(c);
                return Store.games(c).keySet();
            }
            case "plan":
                return store.plan(a[0], parts(a, 1), false).get("need");
            case "download":
            case "get": {
                if (cmd.equals("get")) store.plan(a[0], parts(a, 1), false);
                final long stopAt = Long.parseLong(System.getenv().getOrDefault("STORE_STOP_AT", "-1"));
                final AtomicLong last = new AtomicLong(-1);
                final long[] calls = { 0 };
                store.download(a[0], (done, total) -> {
                    synchronized (calls) {
                        calls[0]++;
                        if (done < 0 || done > total) throw new IllegalStateException("progress " + done + "/" + total);
                        last.set(done);
                    }
                    if (stopAt >= 0 && done >= stopAt) store.stop(a[0]);
                });
                Map<String, Object> game = store.install(a[0]);
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("version", game.get("version"));
                r.put("parts", game.get("parts"));
                r.put("done", last.get());
                return r;
            }
            case "install":
                return store.install(a[0]).get("version");
            case "progress":
                return store.progress(a[0]);
            case "verify":
                return store.verify(a[0]);
            case "cleanup":
                return store.cleanup();
            case "state":
                return store.state();
            case "remove":
                store.remove(a[0]);
                return true;
            case "cancel":
                store.cancel(a[0]);
                return true;
            case "droppart":
                return store.dropPart(a[0], a[1]);
            case "file": {
                File f = store.file(a[0], a[1]);
                return f == null || !f.exists() ? null : Fetch.sha256(f);
            }
            case "ed": {
                java.util.Base64.Decoder d = java.util.Base64.getDecoder();
                return Ed25519.verify(d.decode(a[0]), d.decode(a[1]), d.decode(a[2]));
            }
            case "notes":
                return store.notes(store.catalog());
            case "readnotes":
                return store.notes();
            case "updates":
                return store.updates(store.catalog());
            case "seed": {
                Map<String, byte[]> pictures = new LinkedHashMap<>();
                for (int i = 2; i < a.length; i++) {
                    File f = new File(a[i]);
                    pictures.put(f.getName(), java.nio.file.Files.readAllBytes(f.toPath()));
                }
                return store.seed(java.nio.file.Files.readAllBytes(new File(a[0]).toPath()), Fetch.readText(new File(a[1])), pictures);
            }
            case "picture": {
                File f = store.picture(a[0]);
                return f != null && f.exists();
            }
            default:
                throw new Fetch.Failure("usage", cmd);
        }
    }
}
