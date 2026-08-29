from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Inspection, Detection, DamageReport
import os, uuid, json, io
from datetime import datetime, timezone

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"]


# ── Upload image + run inference ───────────────────────────────────────────
@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only JPEG and PNG images are allowed.")

    image_bytes = await file.read()

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large. Maximum size is 10MB.")

    # Save image to disk
    filename  = f"{uuid.uuid4()}.jpg"
    filepath  = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(image_bytes)

    # Create inspection record
    inspection = Inspection(image_url=filepath, status="processing")
    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    # Run YOLOv8 inference
    try:
        from app.services.detection import run_inference
        detections = run_inference(image_bytes)
    except Exception as e:
        inspection.status = "failed"
        db.commit()
        raise HTTPException(500, f"Inference failed: {str(e)}")

    # Save detections
    for det in detections:
        record = Detection(
            inspection_id=inspection.id,
            damage_type=det["damage_type"],
            confidence=det["confidence"],
            bounding_box=det["bounding_box"]
        )
        db.add(record)

    # Auto-generate damage report
    severity = _calculate_severity(detections)
    report = DamageReport(
        inspection_id=inspection.id,
        severity=severity,
        notes=f"Auto-generated. {len(detections)} damage(s) detected."
    )
    db.add(report)

    inspection.status = "completed"
    db.commit()

    return {
        "inspection_id": str(inspection.id),
        "filename": filename,
        "status": "completed",
        "severity": severity,
        "total_detections": len(detections),
        "detections": detections
    }


# ── Get all inspections ────────────────────────────────────────────────────
@router.get("/inspections")
def get_inspections(db: Session = Depends(get_db)):
    inspections = db.query(Inspection).order_by(
        Inspection.inspected_at.desc()
    ).all()
    return [
        {
            "id": str(i.id),
            "image_url": i.image_url,
            "status": i.status,
            "inspected_at": str(i.inspected_at)
        }
        for i in inspections
    ]


# ── Get single inspection with detections ─────────────────────────────────
@router.get("/inspections/{inspection_id}")
def get_inspection(inspection_id: str, db: Session = Depends(get_db)):
    inspection = db.query(Inspection).filter(
        Inspection.id == inspection_id
    ).first()
    if not inspection:
        raise HTTPException(404, "Inspection not found.")

    detections = db.query(Detection).filter(
        Detection.inspection_id == inspection_id
    ).all()

    report = db.query(DamageReport).filter(
        DamageReport.inspection_id == inspection_id
    ).first()

    return {
        "id": str(inspection.id),
        "image_url": inspection.image_url,
        "status": inspection.status,
        "inspected_at": str(inspection.inspected_at),
        "severity": report.severity if report else "N/A",
        "notes": report.notes if report else "",
        "total_detections": len(detections),
        "detections": [
            {
                "id": str(d.id),
                "damage_type": d.damage_type,
                "confidence": d.confidence,
                "bounding_box": d.bounding_box
            }
            for d in detections
        ]
    }


# ── Generate PDF report ────────────────────────────────────────────────────
@router.get("/inspections/{inspection_id}/report")
def generate_report(inspection_id: str, db: Session = Depends(get_db)):
    inspection = db.query(Inspection).filter(
        Inspection.id == inspection_id
    ).first()
    if not inspection:
        raise HTTPException(404, "Inspection not found.")

    detections = db.query(Detection).filter(
        Detection.inspection_id == inspection_id
    ).all()

    report = db.query(DamageReport).filter(
        DamageReport.inspection_id == inspection_id
    ).first()

    # Build PDF using reportlab
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.units import cm
    except ImportError:
        raise HTTPException(500, "reportlab not installed. Run: pip install reportlab")

    buffer = io.BytesIO()
    doc    = SimpleDocTemplate(buffer, pagesize=A4,
                               rightMargin=2*cm, leftMargin=2*cm,
                               topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    story  = []

    # Title
    title_style = ParagraphStyle("title", parent=styles["Title"],
                                 fontSize=20, textColor=colors.HexColor("#1F4E79"))
    story.append(Paragraph("Roadtection — Inspection Report", title_style))
    story.append(Spacer(1, 0.4*cm))

    # Meta info
    meta_style = ParagraphStyle("meta", parent=styles["Normal"], fontSize=10,
                                textColor=colors.HexColor("#595959"))
    story.append(Paragraph(f"Inspection ID: {inspection_id}", meta_style))
    story.append(Paragraph(f"Date: {inspection.inspected_at.strftime('%Y-%m-%d %H:%M')}", meta_style))
    story.append(Paragraph(f"Status: {inspection.status.upper()}", meta_style))
    story.append(Paragraph(f"Severity: {report.severity if report else 'N/A'}", meta_style))
    story.append(Spacer(1, 0.5*cm))

    # Summary box
    summary_data = [
        ["Total Detections", "Severity", "Status"],
        [str(len(detections)), report.severity if report else "N/A", inspection.status.upper()]
    ]
    summary_table = Table(summary_data, colWidths=[5*cm, 5*cm, 5*cm])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F4E79")),
        ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
        ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",   (0, 0), (-1, -1), 10),
        ("ALIGN",      (0, 0), (-1, -1), "CENTER"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#D6E4F0"), colors.white]),
        ("GRID",       (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 0.5*cm))

    # Detections table
    heading_style = ParagraphStyle("heading", parent=styles["Heading2"],
                                   fontSize=13, textColor=colors.HexColor("#2E75B6"))
    story.append(Paragraph("Detection Results", heading_style))
    story.append(Spacer(1, 0.3*cm))

    if detections:
        det_data = [["#", "Damage Type", "Confidence", "Bounding Box"]]
        for i, d in enumerate(detections, 1):
            bb = d.bounding_box
            bbox_str = f"({bb['x1']}, {bb['y1']}) → ({bb['x2']}, {bb['y2']})" if isinstance(bb, dict) else str(bb)
            det_data.append([
                str(i),
                d.damage_type,
                f"{d.confidence * 100:.1f}%",
                bbox_str
            ])
        det_table = Table(det_data, colWidths=[1*cm, 5*cm, 3*cm, 8*cm])
        det_table.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, 0), colors.HexColor("#2E75B6")),
            ("TEXTCOLOR",     (0, 0), (-1, 0), colors.white),
            ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",      (0, 0), (-1, -1), 9),
            ("ALIGN",         (0, 0), (0, -1), "CENTER"),
            ("ALIGN",         (2, 0), (2, -1), "CENTER"),
            ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F5F5")]),
            ("GRID",          (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
            ("TOPPADDING",    (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(det_table)
    else:
        story.append(Paragraph("No damage detected in this inspection.", meta_style))

    story.append(Spacer(1, 0.5*cm))

    # Notes
    if report and report.notes:
        story.append(Paragraph("Notes", heading_style))
        story.append(Paragraph(report.notes, meta_style))
        story.append(Spacer(1, 0.3*cm))

    # Footer
    story.append(Spacer(1, 1*cm))
    footer_style = ParagraphStyle("footer", parent=styles["Normal"],
                                  fontSize=8, textColor=colors.grey, alignment=1)
    story.append(Paragraph(
        f"Generated by Roadtection  |  {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')} UTC",
        footer_style
    ))

    doc.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{inspection_id[:8]}.pdf"}
    )


# ── Helper — calculate severity ────────────────────────────────────────────
def _calculate_severity(detections: list) -> str:
    if not detections:
        return "None"
    avg_confidence = sum(d["confidence"] for d in detections) / len(detections)
    count = len(detections)
    if count >= 5 or avg_confidence >= 0.85:
        return "High"
    elif count >= 2 or avg_confidence >= 0.60:
        return "Medium"
    else:
        return "Low"