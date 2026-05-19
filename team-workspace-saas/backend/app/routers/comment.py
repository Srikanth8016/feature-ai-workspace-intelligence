from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.task_comment import TaskComment
from app.schemas.comment_schema import CommentCreate
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
async def create_comment(
    task_id: int,
    request: CommentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    comment = TaskComment(
        content=request.content,
        task_id=task_id,
        user_id=current_user.id
    )

    db.add(comment)
    db.commit()

    # Trigger real-time task update broadcast to sync comments drawer
    asyncio.create_task(
        manager.broadcast("task_updated")
    )

    return {
        "message": "Comment added"
    }

@router.get("/{task_id}")
def get_comments(
    task_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    comments = db.query(TaskComment).filter(
        TaskComment.task_id == task_id
    ).all()

    return comments
