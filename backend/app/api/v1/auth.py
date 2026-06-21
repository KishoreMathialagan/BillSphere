from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.auth import Login, Token, RefreshRequest, RegisterRequest
from app.db.session import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.models.branch import Branch
from app.api.dependencies import get_current_user
from pydantic import BaseModel
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

class ProfileUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    business_name: str | None = None
    logo_url: str | None = None
    branch_name: str | None = None
    address: str | None = None

@router.get("/profile")
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tenant = db.query(Tenant).filter(Tenant.tenant_id == current_user.tenant_id).first()
    branch = db.query(Branch).filter(Branch.tenant_id == current_user.tenant_id).first()
    
    return {
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "phone": getattr(current_user, 'phone', None),
        "role": current_user.role,
        "business_name": tenant.business_name if tenant else None,
        "logo_url": getattr(tenant, 'logo_url', None) if tenant else None,
        "branch_name": branch.branch_name if branch else None,
        "address": branch.address if branch else None
    }

@router.put("/profile")
def update_profile(profile_data: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tenant = db.query(Tenant).filter(Tenant.tenant_id == current_user.tenant_id).first()
    branch = db.query(Branch).filter(Branch.tenant_id == current_user.tenant_id).first()
    
    if profile_data.first_name is not None: current_user.first_name = profile_data.first_name
    if profile_data.last_name is not None: current_user.last_name = profile_data.last_name
    if profile_data.email is not None: current_user.email = profile_data.email
    if profile_data.phone is not None: current_user.phone = profile_data.phone
    
    if tenant:
        if profile_data.business_name is not None: tenant.business_name = profile_data.business_name
        if profile_data.logo_url is not None: tenant.logo_url = profile_data.logo_url
        
    if branch:
        if profile_data.branch_name is not None: branch.branch_name = profile_data.branch_name
        if profile_data.address is not None: branch.address = profile_data.address
    elif profile_data.branch_name or profile_data.address:
        # Create a branch if none exists but data is provided
        new_branch = Branch(
            tenant_id=current_user.tenant_id,
            branch_name=profile_data.branch_name or "Main Branch",
            address=profile_data.address
        )
        db.add(new_branch)
        
    db.commit()
    return {"message": "Profile updated successfully"}
