from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import re

from app.auth.oauth2 import get_current_user, get_db
from app.models.user import User

router = APIRouter()

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

@router.get("/me")
def current_user(
    user = Depends(get_current_user)
):
    return {
        "logged_in_user": user.username,
        "email": user.email
    }

@router.put("/me")
def update_profile(
    email: str = None,
    username: str = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if email:
        if not EMAIL_REGEX.match(email):
            raise HTTPException(status_code=400, detail="Invalid email format")
        if email != current_user.email:
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered")
            current_user.email = email
    if username:
        if username != current_user.username:
            existing = db.query(User).filter(User.username == username).first()
            if existing:
                raise HTTPException(status_code=400, detail="Username already taken")
            current_user.username = username
            
    db.commit()
    db.refresh(current_user)
    return {
        "message": "Profile updated successfully",
        "logged_in_user": current_user.username,
        "email": current_user.email
    }
