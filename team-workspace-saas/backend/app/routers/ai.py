from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.oauth2 import get_current_user, get_db
from app.services.ai_service import (
    generate_tasks, generate_progress_summary, generate_sprint_plan,
    generate_chat_response, generate_risk_analysis, generate_meeting_tasks,
)
from app.models.task import Task
from app.models.project import Project
from app.models.activity_log import ActivityLog
from app.models.workspace import Workspace
from app.core.limits import require_ai_access

router = APIRouter()


class AIRequest(BaseModel):
    prompt: str


class SprintRequest(BaseModel):
    scope: str


class ChatRequest(BaseModel):
    message: str
    workspace_id: int


class MeetingRequest(BaseModel):
    transcript: str


@router.post("/generate-tasks")
async def ai_generate_tasks(
    request: AIRequest,
    current_user=Depends(get_current_user),
):
    require_ai_access(current_user)
    result = await generate_tasks(request.prompt)
    return {"response": result}


@router.post("/summarize/workspace/{workspace_id}")
async def ai_summarize_workspace(
    workspace_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_ai_access(current_user)
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    tasks = db.query(Task).join(Project).filter(Project.workspace_id == workspace_id).all()
    tasks_text = "\n".join([
        f"- [{t.status}] {t.title} (Priority: {t.priority}, Due: {t.due_date})"
        for t in tasks
    ]) or "No active tasks in this workspace."

    activities = (
        db.query(ActivityLog)
        .join(Task)
        .join(Project)
        .filter(Project.workspace_id == workspace_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(20)
        .all()
    )
    activities_text = "\n".join([
        f"- {log.action} at {log.created_at.strftime('%Y-%m-%d %H:%M:%S') if log.created_at else ''}"
        for log in activities
    ]) or "No recent activities recorded."

    result = await generate_progress_summary(tasks_text, activities_text)
    return {"response": result}


@router.post("/generate-sprint")
async def ai_generate_sprint(
    request: SprintRequest,
    current_user=Depends(get_current_user),
):
    require_ai_access(current_user)
    result = await generate_sprint_plan(request.scope)
    return {"response": result}


@router.post("/chat")
async def ai_chat(
    request: ChatRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_ai_access(current_user)
    workspace = db.query(Workspace).filter(Workspace.id == request.workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    tasks = db.query(Task).join(Project).filter(Project.workspace_id == request.workspace_id).all()
    tasks_text = "\n".join([
        f"- [{t.status}] {t.title} (Priority: {t.priority}, Due: {t.due_date})"
        for t in tasks
    ]) or "No active tasks in this workspace."

    result = await generate_chat_response(request.message, tasks_text)
    return {"response": result}


@router.post("/predict-risks/{workspace_id}")
async def ai_predict_risks(
    workspace_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_ai_access(current_user)
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    tasks = db.query(Task).join(Project).filter(Project.workspace_id == workspace_id).all()
    tasks_text = "\n".join([
        f"- [{t.status}] {t.title} (Priority: {t.priority}, Due: {t.due_date})"
        for t in tasks
    ]) or "No active tasks in this workspace."

    result = await generate_risk_analysis(tasks_text)
    return {"response": result}


@router.post("/parse-meeting")
async def ai_parse_meeting(
    request: MeetingRequest,
    current_user=Depends(get_current_user),
):
    require_ai_access(current_user)
    result = await generate_meeting_tasks(request.transcript)
    return {"response": result}
