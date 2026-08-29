from ultralytics import YOLO
from PIL import Image
import io
import os

model = None

def load_model():
    global model
    model_path = os.getenv("MODEL_PATH", "./model/yolov8n.pt")
    model = YOLO(model_path)
    print(f"Model loaded from {model_path}")

def run_inference(image_bytes: bytes) -> list:
    global model
    if model is None:
        load_model()

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    results = model(image)

    detections = []
    for result in results:
        for box in result.boxes:
            detection = {
                "damage_type": result.names[int(box.cls)],
                "confidence": round(float(box.conf), 4),
                "bounding_box": {
                    "x1": round(float(box.xyxy[0][0]), 2),
                    "y1": round(float(box.xyxy[0][1]), 2),
                    "x2": round(float(box.xyxy[0][2]), 2),
                    "y2": round(float(box.xyxy[0][3]), 2),
                }
            }
            detections.append(detection)

    return detections