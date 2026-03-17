from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc
from sqlalchemy.exc import IntegrityError
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User, Workspace, WorkspaceMember
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
import uuid
import re

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _slug(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "ws"  # fallback for non-ASCII names


@router.post("/register", status_code=201, response_model=TokenResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
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


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
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
    token = create_access_token({"sub": user.id, "workspace_id": member.workspace_id})
    return TokenResponse(access_token=token, workspace_id=member.workspace_id)
