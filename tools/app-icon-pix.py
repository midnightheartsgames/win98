import argparse
import base64
import io
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
ICON_DIR = ROOT / "content" / "app-icons"
ICONS_JS = ROOT / "js" / "icons.js"
FILE_SIZE = 128
FILE_COLORS = 96
EMBED_SIZE = 64
EMBED_COLORS = 64
BACKGROUND_MARGIN = 3


def background_mask(rgb):
    r = rgb[..., 0].astype(int)
    g = rgb[..., 1].astype(int)
    b = rgb[..., 2].astype(int)
    magenta = (r > 150) & (b > 150) & ((r + b) // 2 - g > 110)
    labels, count = ndimage.label(magenta)
    if count == 0:
        return magenta
    edge = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    edge = edge[edge != 0]
    background = np.isin(labels, edge)
    return ndimage.binary_dilation(background, iterations=BACKGROUND_MARGIN)


def cut_out(image):
    if "transparency" in image.info or image.mode in ("RGBA", "LA", "PA"):
        converted = image.convert("RGBA")
        if np.asarray(converted)[..., 3].min() < 255:
            return converted
    rgb = np.asarray(image.convert("RGB"))
    alpha = np.where(background_mask(rgb), 0, 255).astype(np.uint8)
    return Image.fromarray(np.dstack([rgb, alpha]), "RGBA")


def square_crop(image):
    box = image.getchannel("A").getbbox()
    cropped = image.crop(box)
    side = max(cropped.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(cropped, ((side - cropped.width) // 2, (side - cropped.height) // 2))
    return canvas


def shrink(image, size):
    premultiplied = image.convert("RGBa").resize((size, size), Image.LANCZOS)
    return premultiplied.convert("RGBA")


def quantize(image, colors):
    return image.quantize(colors=colors, method=Image.FASTOCTREE, dither=Image.NONE)


def png_bytes(image):
    buffer = io.BytesIO()
    image.save(buffer, "PNG", optimize=True)
    return buffer.getvalue()


def svg_for(png):
    encoded = base64.b64encode(png).decode("ascii")
    return (
        '<svg viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg">'
        '<image href="data:image/png;base64,%s" x="0" y="0" width="%d" height="%d"/></svg>'
        % (EMBED_SIZE, EMBED_SIZE, encoded, EMBED_SIZE, EMBED_SIZE)
    )


def replace_icon(source, key, svg):
    quoted = re.escape(key)
    plain = re.compile(r"(?m)^(    '%s':\s*)`[^`]*`(,?)(?=\r?$)" % quoted)
    pixel = re.compile(r"(?m)^(    '%s':\s*)px\(\s*`[^`]*`(?:\s*,\s*`[^`]*`)?\s*\)(,?)(?=\r?$)" % quoted)
    for pattern in (plain, pixel):
        if pattern.search(source):
            return pattern.sub(lambda m: m.group(1) + "`" + svg + "`" + m.group(2), source, count=1)
    return None


def add_icon(source, key, svg):
    newline = "\r\n" if "\r\n" in source else "\n"
    entry = "    '%s': `%s`,%s" % (key, svg, newline)
    end = source.find("  return icons;")
    close = source.rfind("  };", 0, end)
    if end < 0 or close < 0:
        return None
    head = source[:close]
    stripped = head.rstrip()
    if not stripped.endswith(","):
        head = stripped + "," + head[len(stripped):]
    return head + entry + source[close:]


def process(path):
    cut = square_crop(cut_out(Image.open(path)))
    file_png = png_bytes(quantize(shrink(cut, FILE_SIZE), FILE_COLORS))
    embed_png = png_bytes(quantize(shrink(cut, EMBED_SIZE), EMBED_COLORS))
    path.write_bytes(file_png)
    return len(file_png), embed_png


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("keys", nargs="*")
    parser.add_argument("--no-js", action="store_true")
    parser.add_argument("--dir", default="")
    parser.add_argument("--skip", nargs="*", default=[])
    parser.add_argument("--add-missing", action="store_true")
    args = parser.parse_args()
    folder = ICON_DIR / args.dir if args.dir else ICON_DIR
    paths = [folder / (key + ".png") for key in args.keys] if args.keys else sorted(folder.glob("*.png"))
    paths = [path for path in paths if path.stem not in args.skip]
    with ICONS_JS.open(encoding="utf-8", newline="") as handle:
        source = handle.read()
    for path in paths:
        key = path.stem
        file_size, embed_png = process(path)
        updated = replace_icon(source, key, svg_for(embed_png))
        if updated is None and args.add_missing:
            updated = add_icon(source, key, svg_for(embed_png))
            print("%s: added as a new entry" % key)
        if updated is None:
            print("%s: %d KB, no entry in icons.js" % (key, file_size // 1024))
            continue
        source = updated
        print("%s: file %d KB, embedded %d KB" % (key, file_size // 1024, len(embed_png) // 1024))
    if not args.no_js:
        with ICONS_JS.open("w", encoding="utf-8", newline="") as handle:
            handle.write(source)


if __name__ == "__main__":
    sys.exit(main())
