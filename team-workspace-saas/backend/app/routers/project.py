from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.project import Project
from app.models.workspace_member import WorkspaceMember
from app.schemas.project_schema import ProjectCreate
from app.auth.oauth2 import get_current_user

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def create_project(
    request: ProjectCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Check if the user is a member of the workspace
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == request.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()

    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to create a project in this workspace")

    project = Project(
        name=request.name,
        workspace_id=request.workspace_id,
        owner_id=current_user.id
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return {
        "message": "Project created",
        "project": project
    }

@router.get("/workspace/{workspace_id}")
def get_workspace_projects(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Check if the user is a member of the workspace
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()

    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to view projects in this workspace")

    projects = db.query(Project).filter(
        Project.workspace_id == workspace_id
    ).all()

    return projects
