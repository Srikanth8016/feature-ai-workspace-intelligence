from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.oauth2 import get_current_user, get_db
from app.services.ai_service import generate_tasks
from app.models.task import Task
from app.models.project import Project
from app.models.activity_log import ActivityLog
from app.models.workspace import Workspace

router = APIRouter()

class AIRequest(BaseModel):
    prompt: str

class SprintRequest(BaseModel):
    scope: str

@router.post("/generate-tasks")
def ai_generate_tasks(
    request: AIRequest,
    current_user = Depends(get_current_user)
):
    result = generate_tasks(
        request.prompt
    )
    return {
        "response": result
    }

@router.post("/summarize/workspace/{workspace_id}")
def ai_summarize_workspace(
    workspace_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    tasks = db.query(Task).join(Project).filter(Project.workspace_id == workspace_id).all()
    tasks_text = "\n".join([
        f"- [{t.status}] {t.title} (Priority: {t.priority}, Due: {t.due_date})"
        for t in tasks
    ]) or "No active tasks in this workspace."
    
    activities = db.query(ActivityLog).join(Task).join(Project).filter(Project.workspace_id == workspace_id).order_by(ActivityLog.created_at.desc()).limit(20).all()
    activities_text = "\n".join([
        f"- {log.action} at {log.created_at.strftime('%Y-%m-%d %H:%M:%S') if log.created_at else ''}"
        for log in activities
    ]) or "No recent activities recorded."
    
    from app.services.ai_service import generate_progress_summary
    result = generate_progress_summary(tasks_text, activities_text)
    
    return {
        "response": result
    }

@router.post("/generate-sprint")
def ai_generate_sprint(
    request: SprintRequest,
    current_user = Depends(get_current_user)
):
    from app.services.ai_service import generate_sprint_plan
    result = generate_sprint_plan(request.scope)
    
    return {
        "response": result
    }
