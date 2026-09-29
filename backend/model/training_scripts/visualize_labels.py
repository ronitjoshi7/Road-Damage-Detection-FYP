import cv2
import random
from pathlib import Path

IMG_DIR   = r"C:\Users\97798\Desktop\rdd2022_yolo\images\train"
LABEL_DIR = r"C:\Users\97798\Desktop\rdd2022_yolo\labels\train"
OUT_DIR   = r"C:\Users\97798\Desktop\rdd2022_yolo\visual_check"

COLORS = {
    0: (255, 0,   0),    # blue  — longitudinal crack
    1: (0,   255, 0),    # green — transverse crack
    2: (0,   0,   255),  # red   — alligator crack
    3: (0,   255, 255),  # yellow — pothole
}
NAMES = {0: "longitudinal", 1: "transverse", 2: "alligator", 3: "pothole"}

Path(OUT_DIR).mkdir(exist_ok=True)

# Pick 10 random images that have labels
labeled = [f for f in Path(LABEL_DIR).glob("*.txt")
           if f.stat().st_size > 0]
samples = random.sample(labeled, min(10, len(labeled)))

for lbl_path in samples:
    img_path = Path(IMG_DIR) / (lbl_path.stem + ".jpg")
    if not img_path.exists():
        continue
    img = cv2.imread(str(img_path))
    if img is None:
        continue
    h, w = img.shape[:2]
    with open(lbl_path) as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) != 5:
                continue
            cls_id, cx, cy, bw, bh = int(parts[0]), float(parts[1]), float(parts[2]), float(parts[3]), float(parts[4])
            x1 = int((cx - bw/2) * w)
            y1 = int((cy - bh/2) * h)
            x2 = int((cx + bw/2) * w)
            y2 = int((cy + bh/2) * h)
            color = COLORS.get(cls_id, (255,255,255))
            cv2.rectangle(img, (x1,y1), (x2,y2), color, 2)
            cv2.putText(img, NAMES.get(cls_id,"?"), (x1, y1-5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
    out_path = Path(OUT_DIR) / img_path.name
    cv2.imwrite(str(out_path), img)
    print(f"Saved: {out_path.name}")

print(f"\nDone. Open folder: {OUT_DIR}")