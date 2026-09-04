from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User
from backend.schemas import LoginRequest, LoginResponse, MeResponse
from backend.auth import verify_password, create_access_token, get_current_user, CurrentUser

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(username=user.username, role=user.role)
    return LoginResponse(access_token=token, username=user.username, role=user.role)

@router.get("/me", response_model=MeResponse)
def me(current_user: CurrentUser = Depends(get_current_user)):
    return MeResponse(username=current_user.username, role=current_user.role)
