from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import ForeignKey

from app.db.database import Base

class TaskComment(Base):
    __tablename__ = "task_comments"

    id = Column(
        Integer,
        primary_key=True
    )

    content = Column(String)

    task_id = Column(
        Integer,
        ForeignKey("tasks.id")
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )
