package com.win98clone.parohod98;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

final class Json {
    private final String s;
    private int i;

    private Json(String s) {
        this.s = s;
    }

    static Object parse(String text) {
        Json p = new Json(text);
        p.space();
        Object v = p.value();
        p.space();
        if (p.i != p.s.length()) throw new IllegalArgumentException("JSON: extra text at " + p.i);
        return v;
    }

    @SuppressWarnings("unchecked")
    static Map<String, Object> object(Object v) {
        if (!(v instanceof Map)) throw new IllegalArgumentException("JSON: object expected");
        return (Map<String, Object>) v;
    }

    @SuppressWarnings("unchecked")
    static List<Object> array(Object v) {
        if (!(v instanceof List)) throw new IllegalArgumentException("JSON: array expected");
        return (List<Object>) v;
    }

    static String str(Map<String, Object> o, String key) {
        Object v = o.get(key);
        return v instanceof String ? (String) v : null;
    }

    static long num(Object v) {
        return v instanceof Number ? ((Number) v).longValue() : 0;
    }

    static String write(Object v) {
        StringBuilder b = new StringBuilder();
        write(b, v);
        return b.toString();
    }

    private static void write(StringBuilder b, Object v) {
        if (v == null) b.append("null");
        else if (v instanceof String) quote(b, (String) v);
        else if (v instanceof Double || v instanceof Float) {
            double d = ((Number) v).doubleValue();
            if (d == Math.rint(d) && Math.abs(d) < 1e15) b.append((long) d);
            else b.append(d);
        } else if (v instanceof Number || v instanceof Boolean) b.append(v);
        else if (v instanceof Map) {
            b.append('{');
            Iterator<? extends Map.Entry<?, ?>> it = ((Map<?, ?>) v).entrySet().iterator();
            while (it.hasNext()) {
                Map.Entry<?, ?> e = it.next();
                quote(b, String.valueOf(e.getKey()));
                b.append(':');
                write(b, e.getValue());
                if (it.hasNext()) b.append(',');
            }
            b.append('}');
        } else if (v instanceof Iterable) {
            b.append('[');
            Iterator<?> it = ((Iterable<?>) v).iterator();
            while (it.hasNext()) {
                write(b, it.next());
                if (it.hasNext()) b.append(',');
            }
            b.append(']');
        } else if (v instanceof long[]) {
            b.append('[');
            long[] a = (long[]) v;
            for (int k = 0; k < a.length; k++) b.append(k > 0 ? "," : "").append(a[k]);
            b.append(']');
        } else quote(b, String.valueOf(v));
    }

    static String quote(String text) {
        StringBuilder b = new StringBuilder();
        quote(b, text);
        return b.toString();
    }

    private static void quote(StringBuilder b, String t) {
        b.append('"');
        for (int k = 0; k < t.length(); k++) {
            char c = t.charAt(k);
            if (c == '"' || c == '\\') b.append('\\').append(c);
            else if (c == '\n') b.append("\\n");
            else if (c == '\r') b.append("\\r");
            else if (c == '\t') b.append("\\t");
            else if (c < 0x20 || c == 0x2028 || c == 0x2029) b.append(String.format("\\u%04x", (int) c));
            else b.append(c);
        }
        b.append('"');
    }

    private void space() {
        while (i < s.length() && Character.isWhitespace(s.charAt(i))) i++;
    }

    private char peek() {
        if (i >= s.length()) throw new IllegalArgumentException("JSON: unexpected end");
        return s.charAt(i);
    }

    private void expect(String word) {
        if (!s.startsWith(word, i)) throw new IllegalArgumentException("JSON: " + word + " expected at " + i);
        i += word.length();
    }

    private Object value() {
        char c = peek();
        if (c == '{') return obj();
        if (c == '[') return arr();
        if (c == '"') return string();
        if (c == 't') { expect("true"); return Boolean.TRUE; }
        if (c == 'f') { expect("false"); return Boolean.FALSE; }
        if (c == 'n') { expect("null"); return null; }
        return number();
    }

    private Map<String, Object> obj() {
        Map<String, Object> o = new LinkedHashMap<>();
        i++;
        space();
        if (peek() == '}') { i++; return o; }
        while (true) {
            space();
            String k = string();
            space();
            expect(":");
            space();
            o.put(k, value());
            space();
            char c = peek();
            i++;
            if (c == '}') return o;
            if (c != ',') throw new IllegalArgumentException("JSON: , expected at " + (i - 1));
        }
    }

    private List<Object> arr() {
        List<Object> a = new ArrayList<>();
        i++;
        space();
        if (peek() == ']') { i++; return a; }
        while (true) {
            space();
            a.add(value());
            space();
            char c = peek();
            i++;
            if (c == ']') return a;
            if (c != ',') throw new IllegalArgumentException("JSON: , expected at " + (i - 1));
        }
    }

    private String string() {
        if (peek() != '"') throw new IllegalArgumentException("JSON: string expected at " + i);
        i++;
        StringBuilder b = new StringBuilder();
        while (true) {
            char c = peek();
            i++;
            if (c == '"') return b.toString();
            if (c != '\\') { b.append(c); continue; }
            char e = peek();
            i++;
            if (e == 'n') b.append('\n');
            else if (e == 't') b.append('\t');
            else if (e == 'r') b.append('\r');
            else if (e == 'b') b.append('\b');
            else if (e == 'f') b.append('\f');
            else if (e == 'u') {
                if (i + 4 > s.length()) throw new IllegalArgumentException("JSON: bad escape");
                b.append((char) Integer.parseInt(s.substring(i, i + 4), 16));
                i += 4;
            } else b.append(e);
        }
    }

    private Object number() {
        int start = i;
        while (i < s.length() && "+-0123456789.eE".indexOf(s.charAt(i)) >= 0) i++;
        String t = s.substring(start, i);
        if (t.isEmpty()) throw new IllegalArgumentException("JSON: value expected at " + start);
        if (t.indexOf('.') < 0 && t.indexOf('e') < 0 && t.indexOf('E') < 0) {
            try {
                return Long.parseLong(t);
            } catch (NumberFormatException ignored) {
                return Double.parseDouble(t);
            }
        }
        return Double.parseDouble(t);
    }
}
