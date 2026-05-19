from pydantic import BaseModel, EmailStr

class InvitationCreate(BaseModel):
    email: EmailStr
    role: str
    workspace_id: int
