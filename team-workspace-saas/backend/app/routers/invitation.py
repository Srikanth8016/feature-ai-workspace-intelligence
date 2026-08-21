import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.invitation import Invitation
from app.models.workspace_member import WorkspaceMember
from app.models.user import User
from app.models.notification import Notification
from app.models.workspace import Workspace
from app.schemas.invitation_schema import InvitationCreate
from app.auth.oauth2 import get_current_user
from app.core.permissions import has_permission
from app.services.email_service import send_workspace_invitation_email

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/pending")
def get_pending_invitations(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Retrieve pending invitations matching current user's email
    invitations = db.query(Invitation).filter(
        Invitation.email == current_user.email
    ).all()
    
    results = []
    for invite in invitations:
        # Check if already joined
        already_member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == invite.workspace_id,
            WorkspaceMember.user_id == current_user.id
        ).first()
        
        if not already_member:
            workspace = db.query(Workspace).filter(Workspace.id == invite.workspace_id).first()
            results.append({
                "id": invite.id,
                "token": invite.token,
                "role": invite.role,
                "workspace_name": workspace.name if workspace else "Unknown Workspace",
                "invited_by": invite.invited_by
            })
    return results

@router.post("/")
def invite_user(
    request: InvitationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Retrieve sender's workspace membership
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == request.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()

    if not membership:
        return {
            "error": "Not workspace member"
        }

    # Only owners and admins can invite
    if not has_permission(membership.role, ["owner", "admin"]):
        return {
            "error": "Permission denied"
        }

    token = str(uuid.uuid4())

    invitation = Invitation(
        email=request.email,
        role=request.role,
        token=token,
        workspace_id=request.workspace_id,
        invited_by=current_user.id
    )

    db.add(invitation)
    db.commit()

    # Get workspace name for the email
    workspace = db.query(Workspace).filter(Workspace.id == request.workspace_id).first()
    workspace_name = workspace.name if workspace else "the workspace"

    # Send invitation email
    send_workspace_invitation_email(
        to_email=request.email,
        invite_token=token,
        workspace_name=workspace_name,
        invited_by_username=current_user.username
    )

    return {
        "message": "Invitation sent",
        "invite_token": token
    }

@router.post("/accept/{token}")
def accept_invitation(
    token: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    invitation = db.query(Invitation).filter(
        Invitation.token == token
    ).first()

    if not invitation:
        return {
            "error": "Invalid invitation"
        }

    existing_member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == invitation.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()

    if existing_member:
        return {
            "message": "Already joined"
        }

    member = WorkspaceMember(
        workspace_id=invitation.workspace_id,
        user_id=current_user.id,
        role=invitation.role
    )

    db.add(member)
    db.commit()

    # Create notification for the inviter
    notification = Notification(
        message=f"{current_user.email} accepted your invitation to join the workspace!",
        user_id=invitation.invited_by
    )
    db.add(notification)
    db.commit()

    return {
        "message": "Joined workspace"
    }
