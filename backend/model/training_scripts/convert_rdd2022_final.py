"""
RDD2022 -> YOLOv8 format conversion
Classes: D00/D01->0, D10/D11->1, D20->2, D40->3
Strategy: original train -> 80% train + 20% val
          original test  -> test
"""
import os
import xml.etree.ElementTree as ET
import shutil
import random
from pathlib import Path
from collections import Counter

DATASET_ROOT = r"C:\Users\97798\Desktop\Final Year Document\extracted datasets"
OUTPUT_DIR   = r"C:\Users\97798\Desktop\rdd2022_yolo"

CLASS_MAP = {
    "D00": 0,
    "D01": 0,
    "D10": 1,
    "D11": 1,
    "D20": 2,
    "D40": 3,
}

COUNTRIES = [
    "Japan", "India", "United_States", "Norway",
    "Czech", "China_Drone", "China_MotorBike"
]

VAL_RATIO = 0.20
random.seed(42)

for split in ["train", "val", "test"]:
    os.makedirs(f"{OUTPUT_DIR}/images/{split}", exist_ok=True)
    os.makedirs(f"{OUTPUT_DIR}/labels/{split}", exist_ok=True)

stats        = Counter()
class_counts = Counter()

def convert_xml(xml_path, img_w, img_h):
    tree = ET.parse(xml_path)
    root = tree.getroot()
    lines = []
    for obj in root.findall("object"):
        name_el = obj.find("name")
        if name_el is None:
            continue
        name = name_el.text.strip()
        if name not in CLASS_MAP:
            stats["skipped_" + name] += 1
            continue
        bndbox = obj.find("bndbox")
        if bndbox is None:
            continue
        try:
            xmin = float(bndbox.find("xmin").text)
            ymin = float(bndbox.find("ymin").text)
            xmax = float(bndbox.find("xmax").text)
            ymax = float(bndbox.find("ymax").text)
        except (TypeError, ValueError, AttributeError):
            stats["bad_bbox"] += 1
            continue
        xmin = max(0.0, min(float(xmin), img_w))
        xmax = max(0.0, min(float(xmax), img_w))
        ymin = max(0.0, min(float(ymin), img_h))
        ymax = max(0.0, min(float(ymax), img_h))
        if xmax <= xmin or ymax <= ymin:
            stats["invalid_bbox"] += 1
            continue
        cx = ((xmin + xmax) / 2) / img_w
        cy = ((ymin + ymax) / 2) / img_h
        w  = (xmax - xmin) / img_w
        h  = (ymax - ymin) / img_h
        cls_id = CLASS_MAP[name]
        class_counts[name] += 1
        lines.append(f"{cls_id} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}")
    return lines

def process_sample(xml_path, img_dir, out_split, country):
    stem     = xml_path.stem
    img_path = img_dir / (stem + ".jpg")
    if not img_path.exists():
        img_path = img_dir / (stem + ".png")
    if not img_path.exists():
        stats["missing_image"] += 1
        return
    try:
        tree  = ET.parse(xml_path)
        root  = tree.getroot()
        size  = root.find("size")
        img_w = int(size.find("width").text)
        img_h = int(size.find("height").text)
        if img_w == 0 or img_h == 0:
            stats["zero_size"] += 1
            return
    except Exception:
        stats["parse_error"] += 1
        return
    lines    = convert_xml(xml_path, img_w, img_h)
    out_stem = f"{country}_{stem}"
    shutil.copy(img_path, f"{OUTPUT_DIR}/images/{out_split}/{out_stem}.jpg")
    with open(f"{OUTPUT_DIR}/labels/{out_split}/{out_stem}.txt", "w") as f:
        f.write("\n".join(lines))
    stats["total"] += 1
    if lines:
        stats["with_labels"] += 1
    else:
        stats["empty_labels"] += 1

for country in COUNTRIES:
    root_path = Path(DATASET_ROOT) / country
    tr_xml = root_path / "train" / "annotations" / "xmls"
    tr_img = root_path / "train" / "images"
    if tr_xml.exists():
        xmls = sorted(tr_xml.glob("*.xml"))
        random.shuffle(xmls)
        n_val      = int(len(xmls) * VAL_RATIO)
        val_xmls   = xmls[:n_val]
        train_xmls = xmls[n_val:]
        print(f"\n{country}: {len(train_xmls)} train | {len(val_xmls)} val")
        for i, x in enumerate(train_xmls):
            process_sample(x, tr_img, "train", country)
            if i % 1000 == 0 and i > 0:
                print(f"  train {i}/{len(train_xmls)}")
        for x in val_xmls:
            process_sample(x, tr_img, "val", country)
    else:
        print(f"WARNING: no train dir for {country}")
    te_xml = root_path / "test" / "annotations" / "xmls"
    te_img = root_path / "test" / "images"
    if te_xml.exists():
        test_xmls = sorted(te_xml.glob("*.xml"))
        print(f"{country}: {len(test_xmls)} test")
        for x in test_xmls:
            process_sample(x, te_img, "test", country)
    else:
        print(f"  NOTE: no test dir for {country} — skipping")

yaml = """\
# RDD2022 — YOLOv8 format
# Update path for Colab: /content/rdd2022_yolo
path: /content/rdd2022_yolo
train: images/train
val:   images/val
test:  images/test

nc: 4
names:
  0: longitudinal_crack
  1: transverse_crack
  2: alligator_crack
  3: pothole
"""
with open(f"{OUTPUT_DIR}/rdd2022.yaml", "w") as f:
    f.write(yaml)

print("\n" + "=" * 55)
print("CONVERSION COMPLETE")
print("=" * 55)
print(f"Total files processed : {stats['total']}")
print(f"With labels           : {stats['with_labels']}")
print(f"Empty labels          : {stats['empty_labels']}")
print(f"Missing images        : {stats['missing_image']}")
print(f"Parse errors          : {stats['parse_error']}")
print(f"Bad/invalid bboxes    : {stats['bad_bbox'] + stats['invalid_bbox']}")
print()
print("Class distribution (kept):")
for cls in ["D00", "D01", "D10", "D11", "D20", "D40"]:
    if class_counts[cls]:
        print(f"  {cls} -> class {CLASS_MAP[cls]} : {class_counts[cls]}")
print()
skipped = {k: v for k, v in stats.items() if k.startswith("skipped_")}
if skipped:
    print("Skipped classes:")
    for k, v in sorted(skipped.items()):
        print(f"  {k.replace('skipped_', '')}: {v} annotations")
print()
for split in ["train", "val", "test"]:
    n = len(list(Path(f"{OUTPUT_DIR}/images/{split}").glob("*.jpg")))
    print(f"  {split:6s}: {n} images")
print(f"\nOutput: {OUTPUT_DIR}")