from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import ForeignKey

from app.db.database import Base

class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(
        Integer,
        primary_key=True
    )

    email = Column(String)
    role = Column(String)
    token = Column(String)

    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id")
    )

    invited_by = Column(
        Integer,
        ForeignKey("users.id")
    )
