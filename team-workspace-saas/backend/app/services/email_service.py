import resend
from app.core.config import settings

resend.api_key = settings.RESEND_API_KEY

FROM_EMAIL = "onboarding@resend.dev"
APP_NAME = "TeamFlow"


def send_password_reset_email(to_email: str, reset_token: str) -> bool:
    """Send a password reset link to the user."""
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": f"Reset your {APP_NAME} password",
            "html": f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #09090b; color: #ffffff; padding: 40px 32px; border-radius: 16px;">
                <div style="margin-bottom: 32px;">
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                        <span style="font-size: 22px;">🔐</span>
                    </div>
                    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px; color: #ffffff;">{APP_NAME}</h1>
                    <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Password Reset Request</p>
                </div>

                <h2 style="font-size: 18px; font-weight: 600; color: #ffffff; margin: 0 0 12px;">Reset your password</h2>
                <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 28px;">
                    We received a request to reset your password. Click the button below to create a new one.
                    This link expires in <strong style="color: #ffffff;">30 minutes</strong>.
                </p>

                <a href="{reset_url}"
                   style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; margin-bottom: 28px;">
                    Reset Password
                </a>

                <p style="color: #52525b; font-size: 12px; line-height: 1.6; margin: 0; border-top: 1px solid #27272a; padding-top: 20px;">
                    If you didn't request this, you can safely ignore this email. Your password won't change.<br><br>
                    Or copy this link: <span style="color: #6366f1;">{reset_url}</span>
                </p>
            </div>
            """
        })
        return True
    except Exception as e:
        print(f"[Email Error] Failed to send password reset email: {e}")
        return False


def send_workspace_invitation_email(
    to_email: str,
    invite_token: str,
    workspace_name: str,
    invited_by_username: str
) -> bool:
    """Send a workspace invitation email."""
    accept_url = f"{settings.FRONTEND_URL}/invite/accept?token={invite_token}"
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": f"You're invited to join {workspace_name} on {APP_NAME}",
            "html": f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #09090b; color: #ffffff; padding: 40px 32px; border-radius: 16px;">
                <div style="margin-bottom: 32px;">
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                        <span style="font-size: 22px;">🤝</span>
                    </div>
                    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px; color: #ffffff;">{APP_NAME}</h1>
                    <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Workspace Invitation</p>
                </div>

                <h2 style="font-size: 18px; font-weight: 600; color: #ffffff; margin: 0 0 12px;">You've been invited!</h2>
                <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
                    <strong style="color: #ffffff;">{invited_by_username}</strong> has invited you to collaborate on
                </p>
                <p style="font-size: 20px; font-weight: 700; color: #6366f1; margin: 0 0 28px;">
                    {workspace_name}
                </p>

                <a href="{accept_url}"
                   style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; margin-bottom: 28px;">
                    Accept Invitation
                </a>

                <p style="color: #52525b; font-size: 12px; line-height: 1.6; margin: 0; border-top: 1px solid #27272a; padding-top: 20px;">
                    If you don't have a {APP_NAME} account yet, you'll be prompted to create one when you click the link.<br><br>
                    Or copy this link: <span style="color: #6366f1;">{accept_url}</span>
                </p>
            </div>
            """
        })
        return True
    except Exception as e:
        print(f"[Email Error] Failed to send invitation email: {e}")
        return False


def send_welcome_email(to_email: str, username: str) -> bool:
    """Send a welcome email after registration."""
    dashboard_url = f"{settings.FRONTEND_URL}/dashboard"
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": f"Welcome to {APP_NAME}! 🚀",
            "html": f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #09090b; color: #ffffff; padding: 40px 32px; border-radius: 16px;">
                <div style="margin-bottom: 32px;">
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                        <span style="font-size: 22px;">🚀</span>
                    </div>
                    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px; color: #ffffff;">{APP_NAME}</h1>
                    <p style="color: #a1a1aa; font-size: 14px; margin: 0;">AI-Powered Team Workspace</p>
                </div>

                <h2 style="font-size: 18px; font-weight: 600; color: #ffffff; margin: 0 0 12px;">Welcome, {username}! 👋</h2>
                <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                    Your account is ready. Here's what you can do with {APP_NAME}:
                </p>

                <ul style="color: #a1a1aa; font-size: 14px; line-height: 2; padding-left: 20px; margin: 0 0 28px;">
                    <li>Create workspaces and invite your team</li>
                    <li>Manage projects with a drag-and-drop Kanban board</li>
                    <li>Use AI to generate tasks, plan sprints, and assess risks</li>
                    <li>Get real-time updates across your whole team</li>
                </ul>

                <a href="{dashboard_url}"
                   style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 14px;">
                    Go to Dashboard
                </a>
            </div>
            """
        })
        return True
    except Exception as e:
        print(f"[Email Error] Failed to send welcome email: {e}")
        return False
