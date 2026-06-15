from sqlalchemy import Column, String, Float, JSON, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
import uuid
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="inspector")
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

class Location(Base):
    __tablename__ = "locations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    road_name = Column(String)
    district = Column(String)

class Inspection(Base):
    __tablename__ = "inspections"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"))
    image_url = Column(String)
    status = Column(String, default="pending")
    inspected_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

class Detection(Base):
    __tablename__ = "detections"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inspection_id = Column(UUID(as_uuid=True), ForeignKey("inspections.id"))
    damage_type = Column(String)
    confidence = Column(Float)
    bounding_box = Column(JSON)

class DamageReport(Base):
    __tablename__ = "damage_reports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    detection_id = Column(UUID(as_uuid=True), ForeignKey("detections.id"))
    severity = Column(String)
    notes = Column(Text)
    reported_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))