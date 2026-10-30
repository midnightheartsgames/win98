import sys
from pathlib import Path

from PIL import Image

PALETTE = {
    ".": (76, 88, 68),
    ",": (62, 70, 55),
    "k": (31, 36, 25),
    "d": (41, 44, 33),
    "w": (216, 222, 211),
    "g": (160, 170, 149),
    "y": (196, 181, 80),
    "o": (149, 136, 49),
    "r": (176, 42, 16),
    "s": (140, 152, 128),
    "b": (36, 52, 60),
    "c": (90, 120, 128),
}

GRID = [
    "................................",
    "................................",
    "..................ss............",
    "................ssssss..........",
    "...............ssggsss..........",
    "..............sssggs.....ss.....",
    "...............sss......ssss....",
    "..................ddd...sss.....",
    ".................dyyyd..........",
    ".................dyyyd..........",
    ".................dkkkd..........",
    ".................dyyyd..........",
    "..........k......dyyyd..........",
    "..........k......dyyyd..........",
    ".........kwk.....dyyyd..........",
    "......wwwwwwwwwwwwwwwwwwww......",
    "......wkwwkwwkwwkwwkwwkwww......",
    ".....gwwwwwwwwwwwwwwwwwwwwg.....",
    "...kkkkkkkkkkkkkkkkkkkkkkkkkk...",
    "...dddddyyydddddddddddddddddd...",
    "....ddddddddddddddddddddddddd...",
    ".....rrrrrrrrrrrrrrrrrrrrrrr....",
    "......rrrrrrrrrrrrrrrrrrrrr.....",
    "cc..cccc..cccc..cccc..cccc..cccc",
    "bccbbbbccbbbbccbbbbccbbbbccbbbbc",
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "bbbbbbbbbbbbbbbbbbbbbbyyybyyybbb",
    "bbbbbbbbbbbbbbbbbbbbbbybybybybbb",
    "bbbbbbbbbbbbbbbbbbbbbbyyybyyybbb",
    "bbbbbbbbbbbbbbbbbbbbbbbbybybybbb",
    "bbbbbbbbbbbbbbbbbbbbbbyyybyyybbb",
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
]


def draw(size):
    cells = len(GRID)
    scale = size // cells
    img = Image.new("RGB", (cells, cells))
    for y, row in enumerate(GRID):
        if len(row) != cells:
            raise ValueError(f"row {y} has {len(row)} cells, expected {cells}")
        for x, ch in enumerate(row):
            img.putpixel((x, y), PALETTE[ch])
    return img.resize((cells * scale, cells * scale), Image.NEAREST)


if __name__ == "__main__":
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent / "parohod98" / "android" / "icon.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    draw(192).save(out)
    print(out)
