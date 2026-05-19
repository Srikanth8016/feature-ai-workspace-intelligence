import os
import shutil

from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.task_attachment import TaskAttachment
from app.auth.oauth2 import get_current_user
from app.websocket.manager import manager
import asyncio

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/{task_id}")
async def upload_file(
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Ensure upload directory exists before saving
    os.makedirs("uploads", exist_ok=True)

    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    attachment = TaskAttachment(
        file_name=file.filename,
        file_url=file_path,
        task_id=task_id,
        uploaded_by=current_user.id
    )

    db.add(attachment)
    db.commit()

    # Trigger real-time task update broadcast to sync file attachments
    asyncio.create_task(
        manager.broadcast("task_updated")
    )

    return {
        "message": "File uploaded",
        "file_url": file_path
    }
