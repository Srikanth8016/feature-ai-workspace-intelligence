from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import ForeignKey

from app.db.database import Base

class TaskAttachment(Base):
    __tablename__ = "task_attachments"

    id = Column(
        Integer,
        primary_key=True
    )

    file_name = Column(String)
    file_url = Column(String)

    task_id = Column(
        Integer,
        ForeignKey("tasks.id")
    )

    uploaded_by = Column(
        Integer,
        ForeignKey("users.id")
    )
