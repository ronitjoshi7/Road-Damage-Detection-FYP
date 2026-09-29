# YOLOv8n Training Results — RDD2022

## Configuration
- Model: YOLOv8n
- Dataset: RDD2022 (7 countries, 30,710 train, 7,675 val)
- Epochs: 50
- Batch: 4
- GPU: NVIDIA GTX 1650 4GB
- Training time: 29.8 hours

## Results
| Metric | Value |
|--------|-------|
| mAP@0.5 | 0.498 |
| mAP@0.5:0.95 | 0.249 |
| Precision | 0.570 |
| Recall | 0.477 |

## Per-class mAP@0.5
| Class | mAP@0.5 |
|-------|---------|
| longitudinal_crack | 0.501 |
| transverse_crack | 0.492 |
| alligator_crack | 0.631 |
| pothole | 0.368 |
