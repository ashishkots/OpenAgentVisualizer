from fastapi import APIRouter, Depends, HTTPException
from starlette.requests import Request
from starlette.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc
from sqlalchemy.exc import IntegrityError
from jose import jwt, JWTError
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.rate_limiter import limiter, AUTH_RATE
from app.core.config import settings
from app.models.user import User, Workspace, WorkspaceMember
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
import uuid
import re

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _slug(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "ws"  # fallback for non-ASCII names


@router.post("/register", status_code=201, response_model=TokenResponse)
@limiter.limit(AUTH_RATE)
async def register(request: Request, req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(User).where(User.email == req.email))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=req.email, hashed_password=hash_password(req.password))
    slug = _slug(req.workspace_name)
    ws = Workspace(name=req.workspace_name, slug=f"{slug}-{uuid.uuid4().hex[:6]}")
    member = WorkspaceMember(workspace=ws, user=user, role="owner")
    db.add_all([user, ws, member])
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    token = create_access_token({"sub": user.id, "workspace_id": ws.id})
    return TokenResponse(access_token=token, workspace_id=ws.id)


@router.post("/login")
@limiter.limit(AUTH_RATE)
async def login(request: Request, req: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == req.email))
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    member = await db.scalar(
        select(WorkspaceMember)
        .where(WorkspaceMember.user_id == user.id)
        .order_by(asc(WorkspaceMember.id))  # deterministic — oldest workspace
    )
    if not member:
        raise HTTPException(status_code=400, detail="No workspace found")

    access_token = create_access_token({"sub": user.id, "workspace_id": member.workspace_id})

    refresh_expires_minutes = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60
    refresh_token = create_access_token(
        data={
            "sub": str(user.id),
            "workspace_id": str(member.workspace_id),
            "type": "refresh",
        },
        expires_delta_minutes=refresh_expires_minutes,
    )

    response = JSONResponse(content={
        "access_token": access_token,
        "token_type": "bearer",
        "workspace_id": str(member.workspace_id),
    })
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )
    return response


@router.post("/refresh")
async def refresh_token(request: Request):
    """Issue a new access token using the refresh token cookie."""
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload.get("sub")
        workspace_id = payload.get("workspace_id")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    access_token = create_access_token(
        data={"sub": user_id, "workspace_id": workspace_id},
    )
    return {"access_token": access_token, "token_type": "bearer"}
