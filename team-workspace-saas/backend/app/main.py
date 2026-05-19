import os
from fastapi import FastAPI
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import user
from app.routers import auth
from app.routers import workspace
from app.routers import project
from app.routers import task
from app.routers import upload
from app.routers import comment
from app.routers import notification
from app.routers import invitation
from app.routers import analytics
from app.routers import ai

# Automatic Database Table Creation Fallback
from app.db.database import Base, engine
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.project import Project
from app.models.task import Task
from app.models.task_attachment import TaskAttachment
from app.models.task_comment import TaskComment
from app.models.notification import Notification
from app.models.invitation import Invitation
from app.models.activity_log import ActivityLog

Base.metadata.create_all(bind=engine)

# Ensure uploads directory exists on startup so static files mount doesn't crash
os.makedirs("uploads", exist_ok=True)

# Disable the default docs route so we can override it
app = FastAPI(docs_url=None)

# Mount Static Uploads Folder
app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Swagger UI",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        # Use unpkg instead of jsdelivr
        swagger_js_url="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css",
    )

app.include_router(
    auth.router,
    prefix="/auth",
    tags=["Auth"]
)

app.include_router(
    user.router,
    prefix="/users",
    tags=["Users"]
)

app.include_router(
    workspace.router,
    prefix="/workspaces",
    tags=["Workspaces"]
)

app.include_router(
    project.router,
    prefix="/projects",
    tags=["Projects"]
)

app.include_router(
    task.router,
    prefix="/tasks",
    tags=["Tasks"]
)

app.include_router(
    upload.router,
    prefix="/upload",
    tags=["Uploads"]
)

app.include_router(
    comment.router,
    prefix="/comments",
    tags=["Comments"]
)

app.include_router(
    notification.router,
    prefix="/notifications",
    tags=["Notifications"]
)

app.include_router(
    invitation.router,
    prefix="/invitations",
    tags=["Invitations"]
)

app.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["Analytics"]
)

app.include_router(
    ai.router,
    prefix="/ai",
    tags=["AI"]
)

from app.routers import ws
app.include_router(ws.router)

@app.get("/")
def home():
    return {"message": "Team Workspace SaaS API"}