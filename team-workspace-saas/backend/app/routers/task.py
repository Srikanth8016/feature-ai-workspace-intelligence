from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.task import Task
from app.models.project import Project
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.task_attachment import TaskAttachment
from app.models.notification import Notification
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.schemas.task_schema import TaskCreate
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

@router.post("/")
async def create_task(
    request: TaskCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.id == request.project_id
    ).first()

    if not project:
        return {
            "error": "Project not found"
        }

    task = Task(
        title=request.title,
        description=request.description,
        status=request.status,
        priority=request.priority,
        due_date=request.due_date,
        project_id=request.project_id,
        assigned_to=request.assigned_to,
        created_by=current_user.id
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    # Log activity
    activity = ActivityLog(
        task_id=task.id,
        user_id=current_user.id,
        action="created the task"
    )
    db.add(activity)
    db.commit()

    # Create automatic assignment notification
    if request.assigned_to:
        notification = Notification(
            message=f"You were assigned task: {task.title}",
            user_id=request.assigned_to
        )
        db.add(notification)
        db.commit()

    # Broadcast task creation in real-time
    asyncio.create_task(
        manager.broadcast("task_updated")
    )

    return {
        "message": "Task created"
    }

@router.get("/{project_id}")
def get_tasks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    tasks = db.query(Task).filter(
        Task.project_id == project_id
    ).all()

    task_list = []
    for task in tasks:
        attachments = db.query(TaskAttachment).filter(TaskAttachment.task_id == task.id).all()
        task_list.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date,
            "project_id": task.project_id,
            "assigned_to": task.assigned_to,
            "created_by": task.created_by,
            "attachments": [
                {
                    "id": att.id,
                    "file_name": att.file_name,
                    "file_url": f"http://127.0.0.1:8000/{att.file_url}"
                } for att in attachments
            ]
        })

    return task_list

@router.put("/{task_id}")
async def update_task_status(
    task_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    task = db.query(Task).filter(
        Task.id == task_id
    ).first()

    if not task:
        return {
            "error": "Task not found"
        }

    task.status = status
    
    # Log activity
    activity = ActivityLog(
        task_id=task.id,
        user_id=current_user.id,
        action=f"moved task to {status}"
    )
    db.add(activity)
    db.commit()

    asyncio.create_task(
        manager.broadcast("task_updated")
    )

    return {
        "message": "Task updated"
    }

@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    workspace = db.query(Workspace).filter(Workspace.id == project.workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check workspace admin/owner permission
    is_owner = (workspace.owner_id == current_user.id)
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == project.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()

    is_admin = is_owner or (member and member.role == "admin")

    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied. Only admins or owners can delete tasks."
        )

    db.delete(task)
    db.commit()

    asyncio.create_task(
        manager.broadcast("task_updated")
    )

    return {"message": "Task deleted successfully"}

@router.get("/{task_id}/activity")
def get_task_activity(
    task_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    logs = db.query(ActivityLog).filter(ActivityLog.task_id == task_id).order_by(ActivityLog.created_at.desc()).all()
    res = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first()
        res.append({
            "id": log.id,
            "action": log.action,
            "created_at": log.created_at,
            "username": user.username if user else "Unknown"
        })
    return res
