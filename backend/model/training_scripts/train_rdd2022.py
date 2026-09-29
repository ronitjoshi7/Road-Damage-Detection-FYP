import torch
from ultralytics import YOLO

def main():
    print(f"PyTorch: {torch.__version__}")
    print(f"CUDA: {torch.cuda.is_available()}")
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")

    # Update YAML with correct local path
    yaml_path = r"C:\Users\97798\Desktop\rdd2022_yolo\rdd2022.yaml"
    with open(yaml_path, "w") as f:
        f.write("""# RDD2022 — YOLOv8 format
path: C:/Users/97798/Desktop/rdd2022_yolo
train: images/train
val:   images/val

nc: 4
names:
  0: longitudinal_crack
  1: transverse_crack
  2: alligator_crack
  3: pothole
""")
    print("YAML updated")

    model = YOLO("yolov8n.pt")

    results = model.train(
        data=yaml_path,
        epochs=50,
        imgsz=640,
        batch=4,
        lr0=0.01,
        weight_decay=0.0005,
        patience=10,
        device=0,
        project=r"C:\Users\97798\Desktop\rdd2022_runs",
        name="rdd2022_v1",
        exist_ok=True,
        plots=True,
        workers=0,
        cache=False,
        verbose=True,
        amp=False,
    )

    print("\n" + "="*50)
    print("TRAINING COMPLETE")
    print("="*50)
    print(f"Best model: {results.save_dir}\\weights\\best.pt")

if __name__ == '__main__':
    main()