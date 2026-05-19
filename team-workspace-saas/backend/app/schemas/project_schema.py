from pydantic import BaseModel

class ProjectCreate(BaseModel):
    name: str
    workspace_id: int
