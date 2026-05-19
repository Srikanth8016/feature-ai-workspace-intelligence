from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import ForeignKey
from sqlalchemy import String

from app.db.database import Base

class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    id = Column(
        Integer,
        primary_key=True
    )

    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id")
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    role = Column(String)
