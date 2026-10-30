package com.win98clone.parohod98;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

final class Ed25519 {
    private static final long[] GF0 = new long[16];
    private static final long[] GF1 = gf(1);
    private static final long[] D = gf(0x78a3, 0x1359, 0x4dca, 0x75eb, 0xd8ab, 0x4141, 0x0a4d, 0x0070, 0xe898, 0x7779, 0x4079, 0x8cc7, 0xfe73, 0x2b6f, 0x6cee, 0x5203);
    private static final long[] D2 = gf(0xf159, 0x26b2, 0x9b94, 0xebd6, 0xb156, 0x8283, 0x149a, 0x00e0, 0xd130, 0xeef3, 0x80f2, 0x198e, 0xfce7, 0x56df, 0xd9dc, 0x2406);
    private static final long[] X = gf(0xd51a, 0x8f25, 0x2d60, 0xc956, 0xa7b2, 0x9525, 0xc760, 0x692c, 0xdc5c, 0xfdd6, 0xe231, 0xc0a4, 0x53fe, 0xcd6e, 0x36d3, 0x2169);
    private static final long[] Y = gf(0x6658, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666);
    private static final long[] I = gf(0xa0b0, 0x4a0e, 0x1b27, 0xc4ee, 0xe478, 0xad2f, 0x1806, 0x2f43, 0xd7a7, 0x3dfb, 0x0099, 0x2b4d, 0xdf0b, 0x4fc1, 0x2480, 0x2b83);
    private static final long[] L = {
        0xed, 0xd3, 0xf5, 0x5c, 0x1a, 0x63, 0x12, 0x58, 0xd6, 0x9c, 0xf7, 0xa2, 0xde, 0xf9, 0xde, 0x14,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x10
    };

    private Ed25519() {}

    static boolean verify(byte[] message, byte[] signature, byte[] publicKey) {
        if (signature == null || signature.length != 64 || publicKey == null || publicKey.length != 32) return false;
        long[][] q = point();
        if (!unpackNeg(q, publicKey)) return false;
        byte[] h;
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-512");
            sha.update(signature, 0, 32);
            sha.update(publicKey);
            sha.update(message);
            h = sha.digest();
        } catch (NoSuchAlgorithmException e) {
            return false;
        }
        reduce(h);
        long[][] p = point();
        scalarMult(p, q, h);
        byte[] s = new byte[32];
        System.arraycopy(signature, 32, s, 0, 32);
        scalarBase(q, s);
        add(p, q);
        byte[] t = new byte[32];
        pack(t, p);
        int diff = 0;
        for (int i = 0; i < 32; i++) diff |= t[i] ^ signature[i];
        return diff == 0;
    }

    private static long[] gf(long... init) {
        long[] r = new long[16];
        System.arraycopy(init, 0, r, 0, init.length);
        return r;
    }

    private static long[][] point() {
        return new long[][] { new long[16], new long[16], new long[16], new long[16] };
    }

    private static void set(long[] r, long[] a) {
        System.arraycopy(a, 0, r, 0, 16);
    }

    private static void car(long[] o) {
        for (int i = 0; i < 16; i++) {
            o[i] += 1L << 16;
            long c = o[i] >> 16;
            o[i == 15 ? 0 : i + 1] += c - 1 + (i == 15 ? 37 * (c - 1) : 0);
            o[i] -= c << 16;
        }
    }

    private static void sel(long[] p, long[] q, int b) {
        long c = ~(b - 1L);
        for (int i = 0; i < 16; i++) {
            long t = c & (p[i] ^ q[i]);
            p[i] ^= t;
            q[i] ^= t;
        }
    }

    private static void pack25519(byte[] o, long[] n) {
        long[] m = new long[16];
        long[] t = new long[16];
        set(t, n);
        car(t);
        car(t);
        car(t);
        for (int j = 0; j < 2; j++) {
            m[0] = t[0] - 0xffed;
            for (int i = 1; i < 15; i++) {
                m[i] = t[i] - 0xffff - ((m[i - 1] >> 16) & 1);
                m[i - 1] &= 0xffff;
            }
            m[15] = t[15] - 0x7fff - ((m[14] >> 16) & 1);
            int b = (int) ((m[15] >> 16) & 1);
            m[14] &= 0xffff;
            sel(t, m, 1 - b);
        }
        for (int i = 0; i < 16; i++) {
            o[2 * i] = (byte) (t[i] & 0xff);
            o[2 * i + 1] = (byte) (t[i] >> 8);
        }
    }

    private static boolean neq(long[] a, long[] b) {
        byte[] c = new byte[32];
        byte[] d = new byte[32];
        pack25519(c, a);
        pack25519(d, b);
        int diff = 0;
        for (int i = 0; i < 32; i++) diff |= c[i] ^ d[i];
        return diff != 0;
    }

    private static int parity(long[] a) {
        byte[] d = new byte[32];
        pack25519(d, a);
        return d[0] & 1;
    }

    private static void unpack25519(long[] o, byte[] n) {
        for (int i = 0; i < 16; i++) o[i] = (n[2 * i] & 0xff) + ((long) (n[2 * i + 1] & 0xff) << 8);
        o[15] &= 0x7fff;
    }

    private static void add(long[] o, long[] a, long[] b) {
        for (int i = 0; i < 16; i++) o[i] = a[i] + b[i];
    }

    private static void sub(long[] o, long[] a, long[] b) {
        for (int i = 0; i < 16; i++) o[i] = a[i] - b[i];
    }

    private static void mul(long[] o, long[] a, long[] b) {
        long[] t = new long[31];
        for (int i = 0; i < 16; i++) for (int j = 0; j < 16; j++) t[i + j] += a[i] * b[j];
        for (int i = 0; i < 15; i++) t[i] += 38 * t[i + 16];
        System.arraycopy(t, 0, o, 0, 16);
        car(o);
        car(o);
    }

    private static void sq(long[] o, long[] a) {
        mul(o, a, a);
    }

    private static void inv(long[] o, long[] i) {
        long[] c = new long[16];
        set(c, i);
        for (int a = 253; a >= 0; a--) {
            sq(c, c);
            if (a != 2 && a != 4) mul(c, c, i);
        }
        set(o, c);
    }

    private static void pow2523(long[] o, long[] i) {
        long[] c = new long[16];
        set(c, i);
        for (int a = 250; a >= 0; a--) {
            sq(c, c);
            if (a != 1) mul(c, c, i);
        }
        set(o, c);
    }

    private static void add(long[][] p, long[][] q) {
        long[] a = new long[16], b = new long[16], c = new long[16], d = new long[16];
        long[] t = new long[16], e = new long[16], f = new long[16], g = new long[16], h = new long[16];
        sub(a, p[1], p[0]);
        sub(t, q[1], q[0]);
        mul(a, a, t);
        add(b, p[0], p[1]);
        add(t, q[0], q[1]);
        mul(b, b, t);
        mul(c, p[3], q[3]);
        mul(c, c, D2);
        mul(d, p[2], q[2]);
        add(d, d, d);
        sub(e, b, a);
        sub(f, d, c);
        add(g, d, c);
        add(h, b, a);
        mul(p[0], e, f);
        mul(p[1], h, g);
        mul(p[2], g, f);
        mul(p[3], e, h);
    }

    private static void cswap(long[][] p, long[][] q, int b) {
        for (int i = 0; i < 4; i++) sel(p[i], q[i], b);
    }

    private static void pack(byte[] r, long[][] p) {
        long[] tx = new long[16], ty = new long[16], zi = new long[16];
        inv(zi, p[2]);
        mul(tx, p[0], zi);
        mul(ty, p[1], zi);
        pack25519(r, ty);
        r[31] ^= (byte) (parity(tx) << 7);
    }

    private static void scalarMult(long[][] p, long[][] q, byte[] s) {
        set(p[0], GF0);
        set(p[1], GF1);
        set(p[2], GF1);
        set(p[3], GF0);
        for (int i = 255; i >= 0; i--) {
            int b = (s[i >> 3] >> (i & 7)) & 1;
            cswap(p, q, b);
            add(q, p);
            add(p, p);
            cswap(p, q, b);
        }
    }

    private static void scalarBase(long[][] p, byte[] s) {
        long[][] q = point();
        set(q[0], X);
        set(q[1], Y);
        set(q[2], GF1);
        mul(q[3], X, Y);
        scalarMult(p, q, s);
    }

    private static void modL(byte[] r, long[] x) {
        for (int i = 63; i >= 32; i--) {
            long carry = 0;
            int j;
            for (j = i - 32; j < i - 12; j++) {
                x[j] += carry - 16 * x[i] * L[j - (i - 32)];
                carry = (x[j] + 128) >> 8;
                x[j] -= carry << 8;
            }
            x[j] += carry;
            x[i] = 0;
        }
        long carry = 0;
        for (int j = 0; j < 32; j++) {
            x[j] += carry - (x[31] >> 4) * L[j];
            carry = x[j] >> 8;
            x[j] &= 255;
        }
        for (int j = 0; j < 32; j++) x[j] -= carry * L[j];
        for (int i = 0; i < 32; i++) {
            x[i + 1] += x[i] >> 8;
            r[i] = (byte) (x[i] & 255);
        }
    }

    private static void reduce(byte[] r) {
        long[] x = new long[64];
        for (int i = 0; i < 64; i++) x[i] = r[i] & 0xff;
        for (int i = 0; i < 64; i++) r[i] = 0;
        modL(r, x);
    }

    private static boolean unpackNeg(long[][] r, byte[] p) {
        long[] t = new long[16], chk = new long[16], num = new long[16], den = new long[16];
        long[] den2 = new long[16], den4 = new long[16], den6 = new long[16];
        set(r[2], GF1);
        unpack25519(r[1], p);
        sq(num, r[1]);
        mul(den, num, D);
        sub(num, num, r[2]);
        add(den, r[2], den);
        sq(den2, den);
        sq(den4, den2);
        mul(den6, den4, den2);
        mul(t, den6, num);
        mul(t, t, den);
        pow2523(t, t);
        mul(t, t, num);
        mul(t, t, den);
        mul(t, t, den);
        mul(r[0], t, den);
        sq(chk, r[0]);
        mul(chk, chk, den);
        if (neq(chk, num)) mul(r[0], r[0], I);
        sq(chk, r[0]);
        mul(chk, chk, den);
        if (neq(chk, num)) return false;
        if (parity(r[0]) == ((p[31] & 0xff) >> 7)) sub(r[0], GF0, r[0]);
        mul(r[3], r[0], r[1]);
        return true;
    }
}
