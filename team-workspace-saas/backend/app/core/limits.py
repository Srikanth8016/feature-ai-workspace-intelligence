"""Plan limit constants and enforcement helpers."""
from fastapi import HTTPException

PLAN_LIMITS = {
    "free": {"workspaces": 1, "projects_per_workspace": 3, "ai_access": True},
    "pro":  {"workspaces": 999, "projects_per_workspace": 999, "ai_access": True},
}


def get_limits(plan: str) -> dict:
    return PLAN_LIMITS.get(plan or "free", PLAN_LIMITS["free"])


def require_ai_access(user) -> None:
    """Raise 403 if user is on free plan."""
    limits = get_limits(getattr(user, "plan", "free"))
    if not limits["ai_access"]:
        raise HTTPException(
            status_code=403,
            detail="AI features require a Pro plan. Upgrade at /billing."
        )


def check_workspace_limit(user, current_workspace_count: int) -> None:
    limits = get_limits(getattr(user, "plan", "free"))
    if current_workspace_count >= limits["workspaces"]:
        raise HTTPException(
            status_code=403,
            detail=f"Free plan allows {limits['workspaces']} workspace. Upgrade to Pro for unlimited workspaces."
        )


def check_project_limit(user, current_project_count: int) -> None:
    limits = get_limits(getattr(user, "plan", "free"))
    if current_project_count >= limits["projects_per_workspace"]:
        raise HTTPException(
            status_code=403,
            detail=f"Free plan allows {limits['projects_per_workspace']} projects per workspace. Upgrade to Pro for unlimited projects."
        )
