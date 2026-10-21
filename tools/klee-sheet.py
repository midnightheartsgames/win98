import sys, os, subprocess
from PIL import Image, ImageDraw

base = os.path.join(os.environ['TEMP'], 'klee')
ours_dir = sys.argv[1] if len(sys.argv) > 1 else 'ours'
t0, t1 = float(sys.argv[2]), float(sys.argv[3])
out = sys.argv[4]
step = 0.5
times = []
t = t0
while t <= t1 + 1e-6:
    times.append(round(t, 2))
    t += step
cols = 2
W, H = 320, 180
rows = (len(times) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (W * 2 + 8), rows * (H + 4)), (40, 40, 40))
d = ImageDraw.Draw(sheet)
for i, t in enumerate(times):
    r, c = divmod(i, cols)
    x, y = c * (W * 2 + 8), r * (H + 4)
    src = os.path.join(base, 'grid', 's%.3f.png' % t)
    if not os.path.exists(src):
        os.makedirs(os.path.dirname(src), exist_ok=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', 'content/YouVid/klee.mp4', '-frames:v', '1', '-vf', 'scale=320:180', src])
    our = os.path.join(base, ours_dir, 'kL33T4T4T4a-%.2f.png' % t)
    if os.path.exists(src):
        sheet.paste(Image.open(src).convert('RGB').resize((W, H)), (x, y))
    if os.path.exists(our):
        sheet.paste(Image.open(our).convert('RGB').resize((W, H)), (x + W, y))
    d.rectangle((x, y, x + 46, y + 14), fill=(0, 0, 0))
    d.text((x + 3, y + 2), '%.1f' % t, fill=(255, 255, 0))
sheet.save(out)
print(out)
