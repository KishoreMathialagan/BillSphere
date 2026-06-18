from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.auth import Login, Token, RefreshRequest, RegisterRequest
from app.db.session import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from jose import jwt, JWTError
from app.core.config import settings

router = APIRouter()

@router.post("/login", response_model=Token)
def login(credentials: Login, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        subject=user.user_id, tenant_id=user.tenant_id, role=user.role
    )
    refresh_token = create_refresh_token(subject=user.user_id)
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/refresh", response_model=Token)
def refresh_token(request: RefreshRequest, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(request.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise credentials_exception
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        raise credentials_exception
        
    access_token = create_access_token(
        subject=user.user_id, tenant_id=user.tenant_id, role=user.role
    )
    new_refresh_token = create_refresh_token(subject=user.user_id)
    return {"access_token": access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}

@router.post("/register", response_model=Token)
def register(user_in: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists."
        )
    
    tenant = Tenant(
        business_name=user_in.business_name
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    
    new_user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        role="Admin",
        tenant_id=tenant.tenant_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(
        subject=new_user.user_id, tenant_id=new_user.tenant_id, role=new_user.role
    )
    refresh_token = create_refresh_token(subject=new_user.user_id)
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}
