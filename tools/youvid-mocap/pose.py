import json
import os
import sys
import cv2
from ultralytics import YOLO

HERE = os.path.dirname(os.path.abspath(__file__))
video, clip = sys.argv[1], sys.argv[2]
fps_out = float(sys.argv[3]) if len(sys.argv) > 3 else 10
SRC = os.path.join(HERE, '..', '..', 'content', 'video', video)
model = YOLO(os.environ.get('YV_POSE_MODEL', 'yolo11x-pose.pt'))
cap = cv2.VideoCapture(SRC)
fps = cap.get(cv2.CAP_PROP_FPS)
step = max(1, round(fps / fps_out))
out = []
i = 0
while True:
    ok, frame = cap.read()
    if not ok:
        break
    if i % step == 0:
        t = i / fps
        res = model(frame, verbose=False, imgsz=960, conf=0.15)[0]
        people = []
        if res.keypoints is not None and len(res.keypoints):
            kp = res.keypoints.data.cpu().numpy().tolist()
            boxes = res.boxes.xyxy.cpu().numpy().tolist()
            confs = res.boxes.conf.cpu().numpy().tolist()
            for k, b, c in zip(kp, boxes, confs):
                people.append({'box': [round(v, 1) for v in b], 'conf': round(c, 3), 'kp': [[round(p[0], 1), round(p[1], 1), round(p[2], 3)] for p in k]})
        out.append({'t': round(t, 3), 'people': people})
        if len(out) % 50 == 0:
            print(len(out), round(t, 1), flush=True)
    i += 1
json.dump({'w': int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), 'h': int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)), 'frames': out}, open(os.path.join(HERE, f'{clip}-pose.json'), 'w'))
print('done', len(out))
