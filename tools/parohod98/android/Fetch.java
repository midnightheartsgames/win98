package com.win98clone.parohod98;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.zip.GZIPInputStream;

final class Fetch {
    static final class Failure extends Exception {
        final String code;
        final String detail;

        Failure(String code, String detail) {
            super(code + (detail == null || detail.isEmpty() ? "" : ": " + detail));
            this.code = code;
            this.detail = detail == null ? "" : detail;
        }
    }

    interface Counter {
        void add(long bytes);
    }

    private final AtomicBoolean stopped = new AtomicBoolean();
    private final Set<HttpURLConnection> open = ConcurrentHashMap.newKeySet();
    int[] retryDelays = { 2000, 5000, 15000 };

    void abort() {
        stopped.set(true);
        for (HttpURLConnection c : open) c.disconnect();
    }

    boolean stopped() {
        return stopped.get();
    }

    private Failure stopFailure() {
        return new Failure("stopped", "");
    }

    private HttpURLConnection connect(String url, int timeout) throws IOException {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(timeout);
        c.setReadTimeout(timeout);
        c.setUseCaches(false);
        c.setInstanceFollowRedirects(true);
        c.setRequestProperty("Accept-Encoding", "identity");
        c.setRequestProperty("Cache-Control", "no-cache");
        return c;
    }

    byte[] bytes(String url, int timeout) throws Failure {
        if (stopped()) throw stopFailure();
        HttpURLConnection c = null;
        try {
            c = connect(url, timeout);
            open.add(c);
            int code = c.getResponseCode();
            if (code != 200) throw new Failure("http", code + " " + url);
            try (InputStream in = c.getInputStream()) {
                ByteArrayOutputStream buf = new ByteArrayOutputStream();
                byte[] chunk = new byte[65536];
                for (int n; (n = in.read(chunk)) > 0; ) {
                    if (stopped()) throw stopFailure();
                    buf.write(chunk, 0, n);
                }
                return buf.toByteArray();
            }
        } catch (IOException e) {
            if (stopped()) throw stopFailure();
            throw new Failure("offline", String.valueOf(e.getMessage()));
        } finally {
            if (c != null) {
                open.remove(c);
                c.disconnect();
            }
        }
    }

    String text(String url, int timeout) throws Failure {
        return new String(bytes(url, timeout), StandardCharsets.UTF_8);
    }

    void blob(String url, File part, File out, long expected, boolean packed, String sha, String name, Counter counter) throws Failure {
        File tagFile = new File(part.getPath() + ".etag");
        long[] counted = { 0 };
        for (int attempt = 0; ; attempt++) {
            try {
                long have = part.exists() ? part.length() : 0;
                if (have > expected) {
                    part.delete();
                    have = 0;
                }
                recount(counter, counted, have);
                if (have < expected) have = download(url, part, tagFile, have, expected, name, counter, counted);
                unpack(part, out, packed, sha, name);
                part.delete();
                tagFile.delete();
                recount(counter, counted, expected);
                return;
            } catch (Failure f) {
                if (stopped()) throw stopFailure();
                if (f.code.equals("corrupt")) recount(counter, counted, 0);
                if (f.code.equals("http") && f.detail.startsWith("404")) throw f;
                if (attempt >= retryDelays.length) throw f;
                pause(retryDelays[attempt]);
            }
        }
    }

    private static void recount(Counter counter, long[] counted, long n) {
        if (n != counted[0]) counter.add(n - counted[0]);
        counted[0] = n;
    }

    private long download(String url, File part, File tagFile, long have, long expected, String name, Counter counter, long[] counted) throws Failure {
        HttpURLConnection c = null;
        try {
            c = connect(url, 30000);
            if (have > 0) {
                c.setRequestProperty("Range", "bytes=" + have + "-");
                String tag = tagFile.exists() ? readText(tagFile) : "";
                if (!tag.isEmpty()) c.setRequestProperty("If-Range", tag);
            }
            open.add(c);
            if (stopped()) throw stopFailure();
            int code = c.getResponseCode();
            if (code == 200 && have > 0) {
                have = 0;
                recount(counter, counted, 0);
            } else if (code != 200 && code != 206) throw new Failure("http", code + " " + name);
            String etag = c.getHeaderField("ETag");
            if (etag != null) writeText(tagFile, etag);
            long written = have;
            try (InputStream in = c.getInputStream(); OutputStream o = new FileOutputStream(part, have > 0)) {
                byte[] chunk = new byte[65536];
                for (int n; (n = in.read(chunk)) > 0; ) {
                    if (stopped()) throw stopFailure();
                    o.write(chunk, 0, n);
                    written += n;
                    recount(counter, counted, Math.min(written, expected));
                }
            }
            if (part.length() < expected) throw new Failure("offline", name + ": connection closed early");
            return part.length();
        } catch (IOException e) {
            if (stopped()) throw stopFailure();
            throw new Failure("offline", name + ": " + e.getMessage());
        } finally {
            if (c != null) {
                open.remove(c);
                c.disconnect();
            }
        }
    }

    static void unpack(File part, File out, boolean packed, String sha, String name) throws Failure {
        File tmp = new File(out.getPath() + ".tmp");
        out.getParentFile().mkdirs();
        String got;
        try (InputStream raw = new FileInputStream(part); InputStream in = packed ? new GZIPInputStream(raw, 65536) : raw; OutputStream o = new FileOutputStream(tmp)) {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] chunk = new byte[65536];
            for (int n; (n = in.read(chunk)) > 0; ) {
                md.update(chunk, 0, n);
                o.write(chunk, 0, n);
            }
            got = hex(md.digest());
        } catch (IOException | NoSuchAlgorithmException e) {
            got = "";
        }
        if (!got.equals(sha)) {
            tmp.delete();
            part.delete();
            throw new Failure("corrupt", name);
        }
        try {
            Files.move(tmp.toPath(), out.toPath(), StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException e) {
            tmp.delete();
            throw new Failure("write", name + ": " + e.getMessage());
        }
    }

    private void pause(int ms) throws Failure {
        long end = System.currentTimeMillis() + ms;
        while (System.currentTimeMillis() < end) {
            if (stopped()) throw stopFailure();
            try {
                Thread.sleep(Math.min(100, Math.max(1, end - System.currentTimeMillis())));
            } catch (InterruptedException e) {
                throw stopFailure();
            }
        }
    }

    static String sha256(File f) {
        try (InputStream in = new FileInputStream(f)) {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] chunk = new byte[65536];
            for (int n; (n = in.read(chunk)) > 0; ) md.update(chunk, 0, n);
            return hex(md.digest());
        } catch (IOException | NoSuchAlgorithmException e) {
            return "";
        }
    }

    static String sha256(byte[] data) {
        try {
            return hex(MessageDigest.getInstance("SHA-256").digest(data));
        } catch (NoSuchAlgorithmException e) {
            return "";
        }
    }

    static String hex(byte[] b) {
        StringBuilder s = new StringBuilder();
        for (byte x : b) s.append(Character.forDigit((x >> 4) & 15, 16)).append(Character.forDigit(x & 15, 16));
        return s.toString();
    }

    static String readText(File f) {
        try (InputStream in = new FileInputStream(f)) {
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            byte[] chunk = new byte[65536];
            for (int n; (n = in.read(chunk)) > 0; ) buf.write(chunk, 0, n);
            return new String(buf.toByteArray(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            return "";
        }
    }

    static void writeText(File f, String text) throws IOException {
        f.getParentFile().mkdirs();
        File tmp = new File(f.getPath() + ".tmp");
        try (FileOutputStream o = new FileOutputStream(tmp)) {
            o.write(text.getBytes(StandardCharsets.UTF_8));
            o.getFD().sync();
        }
        Files.move(tmp.toPath(), f.toPath(), StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
    }
}
