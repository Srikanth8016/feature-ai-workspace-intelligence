from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import ForeignKey
from sqlalchemy import DateTime

from app.db.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(
        Integer,
        primary_key=True
    )

    title = Column(String)
    description = Column(String)
    status = Column(String)
    priority = Column(String)
    due_date = Column(DateTime)

    project_id = Column(
        Integer,
        ForeignKey("projects.id")
    )

    assigned_to = Column(
        Integer,
        ForeignKey("users.id")
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id")
    )
