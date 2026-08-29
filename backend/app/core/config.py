import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MODEL_PATH: str = os.getenv("MODEL_PATH", "./model/yolov8n.pt")

settings = Settings()