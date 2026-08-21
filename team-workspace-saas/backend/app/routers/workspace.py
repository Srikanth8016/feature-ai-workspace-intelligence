from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.user import User

from app.schemas.workspace_schema import (
    WorkspaceCreate
)

from app.auth.oauth2 import (
    get_current_user
)

from app.core.limits import check_workspace_limit

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def create_workspace(
    request: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user = Depends(
        get_current_user
    )
):
    # Enforce plan workspace limit
    current_count = db.query(WorkspaceMember).filter(
        WorkspaceMember.user_id == current_user.id,
        WorkspaceMember.role == "owner"
    ).count()
    check_workspace_limit(current_user, current_count)

    workspace = Workspace(
        name=request.name,
        owner_id=current_user.id
    )

    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=current_user.id,
        role="owner"
    )

    db.add(member)
    db.commit()

    return {
        "message": "Workspace created"
    }

@router.get("/")
def get_workspaces(
    db: Session = Depends(get_db),
    current_user = Depends(
        get_current_user
    )
):
    memberships = db.query(
        WorkspaceMember
    ).filter(
        WorkspaceMember.user_id == current_user.id
    ).all()

    workspace_ids = [m.workspace_id for m in memberships]
    workspaces = db.query(Workspace).filter(Workspace.id.in_(workspace_ids)).all() if workspace_ids else []
    ws_by_id = {ws.id: ws for ws in workspaces}

    res = []
    for member in memberships:
        ws = ws_by_id.get(member.workspace_id)
        if ws:
            res.append({
                "id": ws.id,
                "name": ws.name,
                "owner_id": ws.owner_id,
                "role": member.role
            })

    return res

@router.get("/{workspace_id}/members")
def get_workspace_members(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    member_check = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member_check:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
        
    memberships = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id
    ).all()
    
    user_ids = [m.user_id for m in memberships]
    users = db.query(User).filter(User.id.in_(user_ids)).all() if user_ids else []
    users_by_id = {u.id: u for u in users}
    
    res = []
    for m in memberships:
        user = users_by_id.get(m.user_id)
        if user:
            res.append({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": m.role
            })
    return res

@router.put("/{workspace_id}/members/{user_id}")
def update_member_role(
    workspace_id: int,
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    requestor_member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    
    is_owner = (workspace.owner_id == current_user.id)
    is_admin = is_owner or (requestor_member and requestor_member.role == "admin")
    
    if not is_admin:
        raise HTTPException(status_code=403, detail="Only workspace admins or owners can update member roles")
        
    target_member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()
    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found in workspace")
        
    if workspace.owner_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot modify workspace owner's role")
        
    target_member.role = role
    db.commit()
    return {"message": "Member role updated successfully", "role": role}

@router.delete("/{workspace_id}/members/{user_id}")
def remove_member(
    workspace_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    requestor_member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    
    is_owner = (workspace.owner_id == current_user.id)
    is_admin = is_owner or (requestor_member and requestor_member.role == "admin")
    
    if not is_admin:
        raise HTTPException(status_code=403, detail="Only workspace admins or owners can remove members")
        
    target_member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()
    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found in workspace")
        
    if workspace.owner_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot remove the workspace owner")
        
    db.delete(target_member)
    db.commit()
    return {"message": "Member removed successfully"}
