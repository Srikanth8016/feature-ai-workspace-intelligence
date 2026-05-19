from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Boolean
from sqlalchemy import ForeignKey

from app.db.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True
    )

    message = Column(String)

    is_read = Column(
        Boolean,
        default=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )
