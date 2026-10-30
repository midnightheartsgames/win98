package com.win98clone.parohod98;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.LongSupplier;

final class Store {
    static final String PRODUCT = "parohod98";
    static final long SPACE_MARGIN = 50L * 1048576;
    private static final String ID = "[a-z0-9]{1,24}";
    private static final String SHA = "[0-9a-f]{64}";

    interface Listener {
        void progress(long done, long total);
    }

    private final File root;
    private final byte[] publicKey;
    private final String base;
    private final String appVersion;
    private final Map<String, Map<String, File>> served = new ConcurrentHashMap<>();
    private final Map<String, Fetch> running = new ConcurrentHashMap<>();
    LongSupplier free;
    int[] retryDelays = { 2000, 5000, 15000 };
    int connections = 6;
    int checkTimeout = 8000;

    Store(File root, String publicKeyBase64, String base, String appVersion) {
        this.root = root;
        this.publicKey = Base64.getDecoder().decode(publicKeyBase64);
        this.base = base.endsWith("/") ? base : base + "/";
        this.appVersion = appVersion;
        this.free = () -> root.getUsableSpace();
        for (String d : new String[] { "store", "staging", "games", "jobs", "notes" }) new File(root, d).mkdirs();
    }

    static boolean validId(String id) {
        return id != null && id.matches(ID);
    }

    static int compareVersions(String a, String b) {
        String[] pa = String.valueOf(a).split("\\."), pb = String.valueOf(b).split("\\.");
        for (int i = 0; i < Math.max(pa.length, pb.length); i++) {
            long x = i < pa.length ? number(pa[i]) : 0, y = i < pb.length ? number(pb[i]) : 0;
            if (x != y) return x < y ? -1 : 1;
        }
        return 0;
    }

    private static long number(String s) {
        return s.matches("\\d{1,9}") ? Long.parseLong(s) : -1;
    }

    private File storeFile(String sha) {
        return new File(root, "store/" + sha);
    }

    private File partFile(String sha) {
        return new File(root, "staging/" + sha + ".part");
    }

    private File gameFile(String id) {
        return new File(root, "games/" + id + ".json");
    }

    private File jobFile(String id) {
        return new File(root, "jobs/" + id + ".json");
    }

    private String pointerUrl(String channel) {
        return base + PRODUCT + "/" + channel + ".json";
    }

    private String blobUrl(Map<String, Object> catalog, String sha) {
        String blobs = Json.str(catalog, "blobs");
        String dir = URI.create(base + PRODUCT + "/").resolve(blobs == null ? "../blobs/" : blobs).toString();
        return dir + sha.substring(0, 2) + "/" + sha + ".bin";
    }

    private Fetch session() {
        Fetch f = new Fetch();
        f.retryDelays = retryDelays;
        return f;
    }

    private Map<String, Object> signed(Fetch f, String url, String query, String what) throws Fetch.Failure {
        byte[] data = f.bytes(url + query, checkTimeout);
        String sig = f.text(url + ".sig" + query, checkTimeout).trim();
        if (!genuine(data, sig)) throw new Fetch.Failure("signature", what);
        try {
            return Json.object(Json.parse(new String(data, StandardCharsets.UTF_8)));
        } catch (IllegalArgumentException e) {
            throw new Fetch.Failure("signature", what);
        }
    }

    private boolean genuine(byte[] data, String sig) {
        try {
            return Ed25519.verify(data, Base64.getDecoder().decode(sig.trim()), publicKey);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private Map<String, Object> readSigned(File f) {
        File s = new File(f.getPath() + ".sig");
        if (!f.exists() || !s.exists()) return null;
        try {
            byte[] data = Fetch.readText(f).getBytes(StandardCharsets.UTF_8);
            if (!genuine(data, Fetch.readText(s))) return null;
            return Json.object(Json.parse(new String(data, StandardCharsets.UTF_8)));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private void writeSigned(File f, byte[] data, String sig) throws IOException {
        Fetch.writeText(new File(f.getPath() + ".sig"), sig.trim());
        Fetch.writeText(f, new String(data, StandardCharsets.UTF_8));
    }

    synchronized Map<String, Object> catalog() {
        return readSigned(new File(root, "catalog.json"));
    }

    synchronized boolean seed(byte[] data, String sig, Map<String, byte[]> pictures) {
        File f = new File(root, "catalog.json");
        if (f.exists() || data == null || sig == null || !genuine(data, sig)) return false;
        try {
            Map<String, Object> catalog = Json.object(Json.parse(new String(data, StandardCharsets.UTF_8)));
            if (!PRODUCT.equals(Json.str(catalog, "product"))) return false;
            for (Map.Entry<String, byte[]> p : pictures.entrySet()) {
                File out = storeFile(p.getKey());
                if (p.getKey().matches(SHA) && !out.exists() && Fetch.sha256(p.getValue()).equals(p.getKey())) writeBytes(out, p.getValue());
            }
            writeSigned(f, data, sig);
            return true;
        } catch (IllegalArgumentException | IOException e) {
            return false;
        }
    }

    Map<String, Object> check(String channel) throws Fetch.Failure {
        if (!"test".equals(channel) && !"stable".equals(channel)) channel = "stable";
        Fetch f = session();
        String query = "?t=" + (System.currentTimeMillis() / 60000);
        String url = pointerUrl(channel);
        byte[] data;
        try {
            data = f.bytes(url + query, checkTimeout);
        } catch (Fetch.Failure e) {
            if ("http".equals(e.code) && e.detail.startsWith("404")) forgetOtherChannel(channel);
            throw e;
        }
        String sig = f.text(url + ".sig" + query, checkTimeout).trim();
        if (!genuine(data, sig)) throw new Fetch.Failure("signature", channel + ".json");
        Map<String, Object> catalog;
        try {
            catalog = Json.object(Json.parse(new String(data, StandardCharsets.UTF_8)));
        } catch (IllegalArgumentException e) {
            throw new Fetch.Failure("signature", channel + ".json");
        }
        if (!PRODUCT.equals(Json.str(catalog, "product")) || !channel.equals(Json.str(catalog, "channel"))) throw new Fetch.Failure("signature", channel + ".json is for another product");
        synchronized (this) {
            try {
                writeSigned(new File(root, "catalog.json"), data, sig);
            } catch (IOException e) {
                throw new Fetch.Failure("write", e.getMessage());
            }
        }
        return catalog;
    }

    private synchronized void forgetOtherChannel(String channel) {
        Map<String, Object> cached = catalog();
        if (cached == null || channel.equals(Json.str(cached, "channel"))) return;
        new File(root, "catalog.json").delete();
        new File(root, "catalog.json.sig").delete();
    }

    int pictures(Map<String, Object> catalog) {
        int fetched = 0;
        Fetch f = session();
        f.retryDelays = new int[0];
        for (Object g : games(catalog).values()) {
            for (String sha : pictureShas(Json.object(g))) {
                File out = storeFile(sha);
                if (out.exists()) continue;
                try {
                    byte[] data = f.bytes(blobUrl(catalog, sha), checkTimeout);
                    File part = partFile(sha);
                    writeBytes(part, data);
                    boolean packed = data.length > 2 && (data[0] & 0xff) == 0x1f && (data[1] & 0xff) == 0x8b;
                    Fetch.unpack(part, out, packed, sha, sha);
                    part.delete();
                    fetched++;
                } catch (Fetch.Failure | IOException e) {
                    partFile(sha).delete();
                }
            }
        }
        return fetched;
    }

    Map<String, Object> updates(Map<String, Object> catalog) {
        Map<String, Object> out = new LinkedHashMap<>();
        Map<String, Object> old = updates();
        for (Map.Entry<String, Object> g : games(catalog).entrySet()) {
            String id = g.getKey(), version = Json.str(Json.object(g.getValue()), "version");
            Map<String, Object> inst = installed(id);
            if (inst == null || version == null || compareVersions(version, Json.str(inst, "version")) <= 0) continue;
            Object known = old.get(id);
            if (known instanceof Map && version.equals(Json.str(Json.object(known), "version"))) {
                out.put(id, known);
                continue;
            }
            try {
                Set<String> want = new HashSet<>();
                Object parts = inst.get("parts");
                if (parts instanceof List) for (Object p : Json.array(parts)) want.add(String.valueOf(p));
                Map<String, Object> u = new LinkedHashMap<>();
                u.put("version", version);
                u.put("bytes", missingBytes(blobSizes(select(manifest(catalog, id), want))));
                out.put(id, u);
            } catch (Fetch.Failure ignored) {
            }
        }
        try {
            Fetch.writeText(new File(root, "updates.json"), Json.write(out));
        } catch (IOException ignored) {
        }
        return out;
    }

    Map<String, Object> updates() {
        File f = new File(root, "updates.json");
        if (!f.exists()) return new LinkedHashMap<>();
        try {
            return Json.object(Json.parse(Fetch.readText(f)));
        } catch (IllegalArgumentException e) {
            return new LinkedHashMap<>();
        }
    }

    private static boolean hasVersion(Map<String, Object> notes, String version) {
        Object list = notes == null ? null : notes.get("versions");
        if (version == null || !(list instanceof List)) return false;
        for (Object v : Json.array(list)) if (version.equals(Json.str(Json.object(v), "version"))) return true;
        return false;
    }

    int notes(Map<String, Object> catalog) {
        Map<String, String[]> wanted = new LinkedHashMap<>();
        Object apk = catalog == null ? null : catalog.get("apk");
        wanted.put("launcher", new String[] { "notes.json", apk instanceof Map ? Json.str(Json.object(apk), "versionName") : null });
        for (Map.Entry<String, Object> g : games(catalog).entrySet()) {
            Map<String, Object> entry = Json.object(g.getValue());
            String path = Json.str(entry, "notes");
            if (validId(g.getKey()) && path != null && path.equals(g.getKey() + "/notes.json")) wanted.put(g.getKey(), new String[] { path, Json.str(entry, "version") });
        }
        int fetched = 0;
        Fetch f = session();
        f.retryDelays = new int[0];
        for (Map.Entry<String, String[]> w : wanted.entrySet()) {
            File out = new File(root, "notes/" + w.getKey() + ".json");
            Map<String, Object> cached = readSigned(out);
            if (cached != null && (w.getValue()[1] == null || hasVersion(cached, w.getValue()[1]))) continue;
            try {
                String url = base + PRODUCT + "/" + w.getValue()[0];
                String query = "?v=" + (w.getValue()[1] == null ? System.currentTimeMillis() / 3600000 : w.getValue()[1]);
                byte[] data = f.bytes(url + query, checkTimeout);
                String sig = f.text(url + ".sig" + query, checkTimeout).trim();
                if (!genuine(data, sig)) continue;
                Json.object(Json.parse(new String(data, StandardCharsets.UTF_8)));
                synchronized (this) {
                    writeSigned(out, data, sig);
                }
                fetched++;
            } catch (Fetch.Failure | IOException | IllegalArgumentException ignored) {
            }
        }
        return fetched;
    }

    synchronized Map<String, Object> notes() {
        Map<String, Object> out = new LinkedHashMap<>();
        String[] names = new File(root, "notes").list();
        if (names != null) for (String n : names) {
            if (!n.endsWith(".json")) continue;
            Map<String, Object> o = readSigned(new File(root, "notes/" + n));
            if (o != null) out.put(n.substring(0, n.length() - 5), o);
        }
        return out;
    }

    private static void writeBytes(File f, byte[] data) throws IOException {
        f.getParentFile().mkdirs();
        try (java.io.FileOutputStream o = new java.io.FileOutputStream(f)) {
            o.write(data);
        }
    }

    private static List<String> pictureShas(Map<String, Object> entry) {
        List<String> out = new ArrayList<>();
        String icon = Json.str(entry, "icon");
        if (icon != null && icon.matches(SHA)) out.add(icon);
        Object shots = entry.get("shots");
        if (shots instanceof List) for (Object s : Json.array(shots)) {
            String sha = Json.str(Json.object(s), "sha256");
            if (sha != null && sha.matches(SHA)) out.add(sha);
        }
        return out;
    }

    static Map<String, Object> games(Map<String, Object> catalog) {
        Object g = catalog == null ? null : catalog.get("games");
        return g instanceof Map ? Json.object(g) : new LinkedHashMap<String, Object>();
    }

    Map<String, Object> installed(String id) {
        File f = gameFile(id);
        if (!validId(id) || !f.exists()) return null;
        try {
            return Json.object(Json.parse(Fetch.readText(f)));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    Map<String, Object> job(String id) {
        File f = jobFile(id);
        if (!validId(id) || !f.exists()) return null;
        try {
            return Json.object(Json.parse(Fetch.readText(f)));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    List<String> jobs() {
        List<Map<String, Object>> list = new ArrayList<>();
        String[] names = new File(root, "jobs").list();
        if (names != null) for (String n : names) {
            if (!n.endsWith(".json")) continue;
            Map<String, Object> j = job(n.substring(0, n.length() - 5));
            if (j != null) list.add(j);
        }
        list.sort((a, b) -> Long.compare(Json.num(a.get("at")), Json.num(b.get("at"))));
        List<String> ids = new ArrayList<>();
        for (Map<String, Object> j : list) ids.add(Json.str(j, "game"));
        return ids;
    }

    private static List<Object> rows(Map<String, Object> o) {
        Object f = o == null ? null : o.get("files");
        return f instanceof List ? Json.array(f) : new ArrayList<Object>();
    }

    private static String partOf(List<Object> row) {
        return row.size() > 4 && row.get(4) instanceof String ? (String) row.get(4) : "";
    }

    private static boolean safePath(String rel) {
        return rel != null && !rel.isEmpty() && !rel.startsWith("/") && !rel.contains("..") && !rel.contains("\\") && !rel.contains("?") && !rel.contains("#");
    }

    private Map<String, Object> manifest(Map<String, Object> catalog, String id) throws Fetch.Failure {
        Object raw = games(catalog).get(id);
        if (!validId(id) || !(raw instanceof Map)) throw new Fetch.Failure("missing", id);
        Map<String, Object> entry = Json.object(raw);
        String minApk = Json.str(entry, "minApk");
        if (minApk != null && compareVersions(appVersion, minApk) < 0) throw new Fetch.Failure("apk", minApk);
        String version = Json.str(entry, "version");
        String manifestPath = Json.str(entry, "manifest");
        if (version == null || manifestPath == null || !manifestPath.matches(ID + "/manifest-[0-9.]+\\.json")) throw new Fetch.Failure("signature", id + " catalog entry");
        Map<String, Object> manifest = signed(session(), base + PRODUCT + "/" + manifestPath, "", manifestPath);
        if (!PRODUCT.equals(Json.str(manifest, "product")) || !id.equals(Json.str(manifest, "game")) || !version.equals(Json.str(manifest, "version"))) throw new Fetch.Failure("signature", manifestPath + " does not match the catalog");
        for (Object r : rows(manifest)) {
            List<Object> row = Json.array(r);
            String rel = (String) row.get(0), sha = (String) row.get(2);
            if (!safePath(rel) || sha == null || !sha.matches(SHA)) throw new Fetch.Failure("signature", manifestPath + ": bad row " + rel);
        }
        return manifest;
    }

    private static List<Object> select(Map<String, Object> manifest, Set<String> want) {
        Set<String> known = new HashSet<>();
        List<Object> files = new ArrayList<>();
        for (Object r : rows(manifest)) {
            List<Object> row = Json.array(r);
            String part = partOf(row);
            if (!part.isEmpty()) known.add(part);
            if (part.isEmpty() || want.contains(part)) files.add(row);
        }
        want.retainAll(known);
        return files;
    }

    private long missingBytes(Map<String, Long> blobs) {
        long n = 0;
        for (Map.Entry<String, Long> b : blobs.entrySet()) if (!storeFile(b.getKey()).exists()) n += b.getValue();
        return n;
    }

    Map<String, Object> plan(String id, List<String> parts, boolean wifiOnly) throws Fetch.Failure {
        Map<String, Object> manifest = manifest(catalog(), id);
        String version = Json.str(manifest, "version");
        Set<String> want = new HashSet<>(parts == null ? new ArrayList<String>() : parts);
        List<Object> files = select(manifest, want);
        Map<String, Long> blobs = blobSizes(files);
        long download = missingBytes(blobs), unpacked = 0;
        for (String sha : blobs.keySet()) if (!storeFile(sha).exists()) unpacked += sizeOf(files, sha);
        long partial = 0;
        for (String sha : blobs.keySet()) if (partFile(sha).exists()) partial += partFile(sha).length();
        long need = download - partial + unpacked + SPACE_MARGIN;
        long freeNow = free.getAsLong();
        if (freeNow < need) throw new Fetch.Failure("space", String.valueOf(need - freeNow));
        Map<String, Object> job = new LinkedHashMap<>();
        job.put("game", id);
        job.put("version", version);
        job.put("parts", new ArrayList<>(want));
        job.put("files", files);
        job.put("need", download);
        job.put("wifi", wifiOnly);
        job.put("paused", false);
        Map<String, Object> old = job(id);
        job.put("at", old != null ? Json.num(old.get("at")) : System.currentTimeMillis());
        writeJob(id, job);
        return job;
    }

    private static Map<String, Long> blobSizes(List<Object> files) {
        Map<String, Long> out = new LinkedHashMap<>();
        for (Object r : files) {
            List<Object> row = Json.array(r);
            long packed = row.size() > 3 ? Json.num(row.get(3)) : 0;
            out.put((String) row.get(2), packed > 0 ? packed : Json.num(row.get(1)));
        }
        return out;
    }

    private static long sizeOf(List<Object> files, String sha) {
        for (Object r : files) {
            List<Object> row = Json.array(r);
            if (sha.equals(row.get(2))) return Json.num(row.get(1));
        }
        return 0;
    }

    synchronized void writeJob(String id, Map<String, Object> job) throws Fetch.Failure {
        try {
            Fetch.writeText(jobFile(id), Json.write(job));
        } catch (IOException e) {
            throw new Fetch.Failure("write", e.getMessage());
        }
    }

    synchronized void mark(String id, String key, Object value) throws Fetch.Failure {
        Map<String, Object> job = job(id);
        if (job == null) return;
        job.put(key, value);
        writeJob(id, job);
    }

    long[] progress(String id) {
        Map<String, Object> job = job(id);
        if (job == null) return new long[] { 0, 0 };
        long need = Json.num(job.get("need")), left = 0;
        for (Map.Entry<String, Long> b : blobSizes(rows(job)).entrySet()) {
            if (storeFile(b.getKey()).exists()) continue;
            File part = partFile(b.getKey());
            left += b.getValue() - (part.exists() ? Math.min(part.length(), b.getValue()) : 0);
        }
        return new long[] { Math.max(0, need - left), need };
    }

    void download(String id, Listener listener) throws Fetch.Failure {
        Map<String, Object> job = job(id);
        if (job == null) throw new Fetch.Failure("missing", id);
        Map<String, Object> catalog = catalog();
        Map<String, Long> blobs = blobSizes(rows(job));
        Map<String, String> names = new HashMap<>();
        Map<String, Boolean> packed = new HashMap<>();
        for (Object r : rows(job)) {
            List<Object> row = Json.array(r);
            names.put((String) row.get(2), (String) row.get(0));
            packed.put((String) row.get(2), row.size() > 3 && Json.num(row.get(3)) > 0);
        }
        List<String> todo = new ArrayList<>();
        for (String sha : blobs.keySet()) if (!storeFile(sha).exists()) todo.add(sha);
        long[] start = progress(id);
        final long total = start[1];
        final AtomicLong done = new AtomicLong(start[0]);
        for (String sha : todo) {
            File part = partFile(sha);
            if (part.exists()) done.addAndGet(-Math.min(part.length(), blobs.get(sha)));
        }
        listener.progress(done.get(), total);
        Fetch f = session();
        running.put(id, f);
        ExecutorService pool = Executors.newFixedThreadPool(Math.max(1, Math.min(connections, todo.size())), r -> {
            Thread t = new Thread(r, "parohod98-download");
            t.setPriority(Thread.NORM_PRIORITY - 2);
            t.setDaemon(true);
            return t;
        });
        List<Future<?>> tasks = new ArrayList<>();
        final Fetch.Failure[] first = { null };
        try {
            for (final String sha : todo) {
                tasks.add(pool.submit(() -> {
                    try {
                        f.blob(blobUrl(catalog, sha), partFile(sha), storeFile(sha), blobs.get(sha), packed.get(sha), sha, names.get(sha), n -> listener.progress(done.addAndGet(n), total));
                    } catch (Fetch.Failure e) {
                        synchronized (first) {
                            if (first[0] == null && !e.code.equals("stopped")) first[0] = e;
                        }
                        if (!e.code.equals("stopped")) f.abort();
                    }
                    return null;
                }));
            }
            for (Future<?> t : tasks) {
                try {
                    t.get();
                } catch (Exception e) {
                    if (first[0] == null) first[0] = new Fetch.Failure("write", String.valueOf(e.getMessage()));
                }
            }
        } finally {
            pool.shutdownNow();
            try {
                pool.awaitTermination(5, TimeUnit.SECONDS);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
            running.remove(id);
        }
        if (first[0] != null) throw first[0];
        if (f.stopped()) throw new Fetch.Failure("stopped", "");
        listener.progress(total, total);
    }

    void stop(String id) {
        Fetch f = running.get(id);
        if (f != null) f.abort();
    }

    boolean ready(String id) {
        Map<String, Object> job = job(id);
        if (job == null) return false;
        for (String sha : blobSizes(rows(job)).keySet()) if (!storeFile(sha).exists()) return false;
        return true;
    }

    synchronized Map<String, Object> install(String id) throws Fetch.Failure {
        Map<String, Object> job = job(id);
        if (job == null) throw new Fetch.Failure("missing", id);
        if (!ready(id)) throw new Fetch.Failure("missing", id + " is not downloaded");
        Map<String, Object> game = new LinkedHashMap<>();
        game.put("game", id);
        game.put("version", job.get("version"));
        game.put("parts", job.get("parts"));
        game.put("date", System.currentTimeMillis());
        game.put("files", job.get("files"));
        try {
            Fetch.writeText(gameFile(id), Json.write(game));
        } catch (IOException e) {
            throw new Fetch.Failure("write", e.getMessage());
        }
        served.remove(id);
        jobFile(id).delete();
        cleanup();
        return game;
    }

    synchronized void cancel(String id) {
        stop(id);
        Map<String, Object> job = job(id);
        jobFile(id).delete();
        if (job == null) return;
        Set<String> keep = referenced();
        for (String sha : blobSizes(rows(job)).keySet()) {
            if (keep.contains(sha)) continue;
            partFile(sha).delete();
            new File(partFile(sha).getPath() + ".etag").delete();
        }
    }

    synchronized void remove(String id) {
        cancel(id);
        gameFile(id).delete();
        served.remove(id);
        cleanup();
    }

    synchronized boolean dropPart(String id, String part) throws Fetch.Failure {
        Map<String, Object> game = installed(id);
        if (game == null || part == null || part.isEmpty()) return false;
        List<Object> files = new ArrayList<>();
        for (Object r : rows(game)) if (!part.equals(partOf(Json.array(r)))) files.add(r);
        List<Object> parts = new ArrayList<>();
        Object had = game.get("parts");
        if (had instanceof List) for (Object p : Json.array(had)) if (!part.equals(p)) parts.add(p);
        game.put("files", files);
        game.put("parts", parts);
        try {
            Fetch.writeText(gameFile(id), Json.write(game));
        } catch (IOException e) {
            throw new Fetch.Failure("write", e.getMessage());
        }
        served.remove(id);
        cleanup();
        return true;
    }

    private Set<String> referenced() {
        Set<String> keep = new HashSet<>();
        String[] names = new File(root, "games").list();
        if (names != null) for (String n : names) if (n.endsWith(".json")) for (Object r : rows(installed(n.substring(0, n.length() - 5)))) keep.add((String) Json.array(r).get(2));
        for (String id : jobs()) for (Object r : rows(job(id))) keep.add((String) Json.array(r).get(2));
        for (Object g : games(catalog()).values()) keep.addAll(pictureShas(Json.object(g)));
        return keep;
    }

    synchronized int cleanup() {
        Set<String> keep = referenced();
        int removed = 0;
        String[] names = new File(root, "store").list();
        if (names != null) for (String n : names) {
            if (keep.contains(n)) continue;
            if (new File(root, "store/" + n).delete()) removed++;
        }
        String[] parts = new File(root, "staging").list();
        if (parts != null) for (String n : parts) {
            String sha = n.replaceFirst("\\.part(\\.etag)?$", "");
            if (!keep.contains(sha)) new File(root, "staging/" + n).delete();
        }
        return removed;
    }

    List<String> verify(String id) {
        List<String> damaged = new ArrayList<>();
        Map<String, Object> game = installed(id);
        if (game == null) return damaged;
        Map<String, Boolean> seen = new HashMap<>();
        for (Object r : rows(game)) {
            List<Object> row = Json.array(r);
            String rel = (String) row.get(0), sha = (String) row.get(2);
            Boolean ok = seen.get(sha);
            if (ok == null) {
                File f = storeFile(sha);
                ok = f.exists() && f.length() == Json.num(row.get(1)) && Fetch.sha256(f).equals(sha);
                if (!ok) f.delete();
                seen.put(sha, ok);
            }
            if (!ok) damaged.add(rel);
        }
        if (!damaged.isEmpty()) served.remove(id);
        return damaged;
    }

    int missing(String id) {
        int n = 0;
        for (Object r : rows(installed(id))) if (!storeFile((String) Json.array(r).get(2)).exists()) n++;
        return n;
    }

    long size(String id) {
        long n = 0;
        Set<String> seen = new HashSet<>();
        for (Object r : rows(installed(id))) {
            List<Object> row = Json.array(r);
            if (seen.add((String) row.get(2))) n += Json.num(row.get(1));
        }
        return n;
    }

    File file(String id, String rel) {
        Map<String, File> map = served.get(id);
        if (map == null) {
            map = new HashMap<>();
            for (Object r : rows(installed(id))) {
                List<Object> row = Json.array(r);
                map.put((String) row.get(0), storeFile((String) row.get(2)));
            }
            served.put(id, map);
        }
        return map.get(rel);
    }

    File picture(String sha) {
        return sha != null && sha.matches(SHA) ? storeFile(sha) : null;
    }

    Map<String, Object> state() {
        Map<String, Object> out = new LinkedHashMap<>();
        Map<String, Object> catalog = catalog();
        Set<String> ids = new HashSet<>(games(catalog).keySet());
        String[] names = new File(root, "games").list();
        if (names != null) for (String n : names) if (n.endsWith(".json")) ids.add(n.substring(0, n.length() - 5));
        ids.addAll(jobs());
        Map<String, Object> games = new LinkedHashMap<>();
        Map<String, Object> updates = updates();
        for (String id : ids) {
            Map<String, Object> g = new LinkedHashMap<>();
            Map<String, Object> inst = installed(id);
            if (inst != null) {
                Map<String, Object> i = new LinkedHashMap<>();
                i.put("version", inst.get("version"));
                i.put("parts", inst.get("parts"));
                i.put("missing", missing(id));
                i.put("bytes", size(id));
                g.put("installed", i);
            }
            Object update = updates.get(id);
            if (inst != null && update instanceof Map && compareVersions(Json.str(Json.object(update), "version"), Json.str(inst, "version")) > 0) g.put("update", update);
            Map<String, Object> job = job(id);
            if (job != null) {
                Map<String, Object> j = new LinkedHashMap<>();
                long[] p = progress(id);
                j.put("version", job.get("version"));
                j.put("parts", job.get("parts"));
                j.put("paused", job.get("paused"));
                j.put("wifi", job.get("wifi"));
                j.put("error", job.get("error"));
                j.put("detail", job.get("detail"));
                j.put("done", p[0]);
                j.put("total", p[1]);
                j.put("ready", ready(id));
                g.put("job", j);
            }
            games.put(id, g);
        }
        out.put("catalog", catalog);
        out.put("games", games);
        out.put("queue", jobs());
        out.put("free", free.getAsLong());
        return out;
    }
}
