from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import SessionLocal
from app.models.task import Task
from app.models.project import Project
from app.auth.oauth2 import get_current_user

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/workspace/{workspace_id}")
def get_workspace_analytics(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Retrieve all projects in workspace
    projects = db.query(Project).filter(Project.workspace_id == workspace_id).all()
    project_ids = [p.id for p in projects]

    if not project_ids:
        return {
            "total_projects": 0,
            "total_tasks": 0,
            "completed_tasks": 0,
            "pending_tasks": 0,
            "overdue_tasks": 0,
            "completion_rate": 0,
            "priority_stats": {"high": 0, "medium": 0, "low": 0}
        }

    # Retrieve all tasks belonging to these projects
    tasks = db.query(Task).filter(Task.project_id.in_(project_ids)).all()

    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == "done")
    pending_tasks = total_tasks - completed_tasks

    now = datetime.now()
    overdue_tasks = sum(
        1 for t in tasks 
        if t.due_date and t.due_date < now and t.status != "done"
    )

    completion_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0

    priority_stats = {
        "high": sum(1 for t in tasks if t.priority == "high"),
        "medium": sum(1 for t in tasks if t.priority == "medium"),
        "low": sum(1 for t in tasks if t.priority == "low")
    }

    return {
        "total_projects": len(projects),
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "overdue_tasks": overdue_tasks,
        "completion_rate": completion_rate,
        "priority_stats": priority_stats
    }
