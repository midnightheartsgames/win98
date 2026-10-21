import sys, os, subprocess
from PIL import Image, ImageDraw

t0, t1, step, out = float(sys.argv[1]), float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
base = os.path.join(os.environ['TEMP'], 'klee', 'grid')
os.makedirs(base, exist_ok=True)
W, H = 256, 144
cols = 6
times = []
t = t0
while t <= t1 + 1e-6:
    times.append(round(t, 3))
    t += step
rows = (len(times) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (W + 4), rows * (H + 4)), (40, 40, 40))
d = ImageDraw.Draw(sheet)
for i, t in enumerate(times):
    f = os.path.join(base, 'g%.3f.png' % t)
    if not os.path.exists(f):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', 'content/YouVid/klee.mp4', '-frames:v', '1', '-vf', 'scale=%d:%d' % (W, H), f])
    r, c = divmod(i, cols)
    x, y = c * (W + 4), r * (H + 4)
    if os.path.exists(f):
        sheet.paste(Image.open(f).convert('RGB'), (x, y))
    d.rectangle((x, y, x + 50, y + 14), fill=(0, 0, 0))
    d.text((x + 3, y + 2), '%.2f' % t, fill=(255, 255, 0))
sheet.save(out)
print(out)
