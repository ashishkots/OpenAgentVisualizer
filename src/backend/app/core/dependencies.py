from fastapi import Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import decode_token, pwd_context as _pwd_ctx
from app.models.user import User, APIKey
from jose import JWTError


async def get_current_user(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    token = authorization.removeprefix("Bearer ")
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.get(User, payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_workspace_id_from_api_key(
    x_api_key: str = Header(None, alias="X-API-Key"),
    db: AsyncSession = Depends(get_db),
) -> str:
    if x_api_key:
        result = await db.execute(
            select(APIKey)
            .where(APIKey.is_active == True)
            .limit(50)  # Hard ceiling: bcrypt is slow; unbounded loop is a DoS vector
        )
        keys = result.scalars().all()
        for key in keys:
            if _pwd_ctx.verify(x_api_key, key.key_hash):
                return key.workspace_id
        raise HTTPException(status_code=401, detail="Invalid API key")
    raise HTTPException(status_code=401, detail="Authentication required")
