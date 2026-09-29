from pathlib import Path

DATASET = r"C:\Users\97798\Desktop\rdd2022_yolo"

for split in ["train", "val"]:
    img_dir = Path(DATASET) / "images" / split
    lbl_dir = Path(DATASET) / "labels" / split

    img_stems = {f.stem for f in img_dir.glob("*.jpg")}
    lbl_stems = {f.stem for f in lbl_dir.glob("*.txt")}

    orphan_labels = lbl_stems - img_stems
    for stem in orphan_labels:
        (lbl_dir / (stem + ".txt")).unlink()

    no_label = img_stems - lbl_stems
    for stem in no_label:
        (lbl_dir / (stem + ".txt")).touch()

    img_final = len(list(img_dir.glob("*.jpg")))
    lbl_final = len(list(lbl_dir.glob("*.txt")))

    print(f"{split}:")
    print(f"  Orphan labels removed : {len(orphan_labels)}")
    print(f"  Empty labels created  : {len(no_label)}")
    print(f"  Images                : {img_final}")
    print(f"  Labels                : {lbl_final}")
    print(f"  Match                 : {'OK' if img_final == lbl_final else 'MISMATCH'}")