from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TaskCreate(BaseModel):
    title: str
    description: str
    status: str
    priority: str
    due_date: datetime
    project_id: int
    assigned_to: Optional[int] = None
