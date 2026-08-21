import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.auth.oauth2 import get_current_user, get_db
from app.models.user import User

stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter()

# ── Plan limits ───────────────────────────────────────────────────────────────
PLAN_LIMITS = {
    "free": {"workspaces": 1, "projects_per_workspace": 3, "ai_access": False},
    "pro":  {"workspaces": 999, "projects_per_workspace": 999, "ai_access": True},
}

PRO_PRICE_ID = "price_pro_monthly"   # replaced below after product creation


# ── Create Stripe Checkout session ────────────────────────────────────────────
@router.post("/create-checkout-session")
def create_checkout_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.plan == "pro":
        raise HTTPException(status_code=400, detail="Already on Pro plan")

    # Create or reuse Stripe customer
    if not current_user.stripe_customer_id:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=current_user.username,
            metadata={"user_id": str(current_user.id)},
        )
        current_user.stripe_customer_id = customer.id
        db.commit()

    # Create checkout session with inline price (no pre-created product needed)
    session = stripe.checkout.Session.create(
        customer=current_user.stripe_customer_id,
        payment_method_types=["card"],
        line_items=[
            {
                "price_data": {
                    "currency": "usd",
                    "unit_amount": 1200,   # $12.00
                    "recurring": {"interval": "month"},
                    "product_data": {
                        "name": "TeamFlow Pro",
                        "description": "Unlimited workspaces, projects, and AI features",
                    },
                },
                "quantity": 1,
            }
        ],
        mode="subscription",
        success_url=f"{settings.FRONTEND_URL}/billing?success=true",
        cancel_url=f"{settings.FRONTEND_URL}/billing?canceled=true",
        metadata={"user_id": str(current_user.id)},
    )
    return {"checkout_url": session.url}


# ── Create Billing Portal session (manage/cancel) ────────────────────────────
@router.post("/create-portal-session")
def create_portal_session(
    current_user: User = Depends(get_current_user),
):
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No billing account found")

    portal = stripe.billing_portal.Session.create(
        customer=current_user.stripe_customer_id,
        return_url=f"{settings.FRONTEND_URL}/billing",
    )
    return {"portal_url": portal.url}


# ── Get current subscription status ──────────────────────────────────────────
@router.get("/subscription")
def get_subscription(
    current_user: User = Depends(get_current_user),
):
    return {
        "plan": current_user.plan,
        "subscription_status": current_user.subscription_status,
        "limits": PLAN_LIMITS.get(current_user.plan, PLAN_LIMITS["free"]),
    }


# ── Stripe Webhook ────────────────────────────────────────────────────────────
@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    # Verify webhook signature if secret is configured
    if settings.STRIPE_WEBHOOK_SECRET:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
    else:
        import json
        event = json.loads(payload)

    event_type = event.get("type", "")
    data = event.get("data", {}).get("object", {})

    # ── subscription activated / renewed ──
    if event_type in ("checkout.session.completed", "invoice.paid"):
        customer_id = data.get("customer")
        subscription_id = data.get("subscription") or data.get("id")

        if customer_id:
            user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
            if user:
                user.plan = "pro"
                user.subscription_status = "active"
                if subscription_id:
                    user.stripe_subscription_id = subscription_id
                db.commit()

    # ── subscription canceled ──
    elif event_type in ("customer.subscription.deleted", "customer.subscription.paused"):
        customer_id = data.get("customer")
        if customer_id:
            user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
            if user:
                user.plan = "free"
                user.subscription_status = "canceled"
                db.commit()

    # ── payment failed ──
    elif event_type == "invoice.payment_failed":
        customer_id = data.get("customer")
        if customer_id:
            user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
            if user:
                user.subscription_status = "past_due"
                db.commit()

    return {"status": "ok"}
