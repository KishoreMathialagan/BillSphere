from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.setup import SetupPayload
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.branch import Branch
from app.models.user import User
from app.core.security import get_password_hash
from app.services.tax_engine import validate_gstin

router = APIRouter()

@router.post("/", status_code=status.HTTP_201_CREATED)
def setup_business(payload: SetupPayload, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.owner_email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if payload.gst_number and not validate_gstin(payload.gst_number):
        raise HTTPException(status_code=400, detail="Invalid GSTIN Format")

    try:
        tenant = Tenant(
            business_name=payload.business_name,
            gst_number=payload.gst_number,
            legal_name=payload.legal_name,
            state=payload.state,
            tenant_name=payload.business_name
        )
        db.add(tenant)
        db.flush()

        branch = Branch(
            tenant_id=tenant.tenant_id,
            branch_name=payload.branch_name,
            address=payload.branch_address
        )
        db.add(branch)
        db.flush()

        user = User(
            tenant_id=tenant.tenant_id,
            email=payload.owner_email,
            password_hash=get_password_hash(payload.owner_password),
            role="Owner"
        )
        db.add(user)
        
        from app.services.accounting import setup_default_accounts
        setup_default_accounts(db, tenant.tenant_id)

        db.commit()
        return {"message": "Business setup completed successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Setup failed. " + str(e))

from app.api.dependencies import get_current_user
from app.schemas.tenant import TenantConfigResponse

@router.get("/config", response_model=TenantConfigResponse)
def get_tenant_config(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tenant = db.query(Tenant).filter(Tenant.tenant_id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

from app.schemas.tenant import TenantConfigUpdate

@router.put("/config", response_model=TenantConfigResponse)
def update_tenant_config(config_update: TenantConfigUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tenant = db.query(Tenant).filter(Tenant.tenant_id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    if config_update.business_name is not None:
        tenant.business_name = config_update.business_name
    if config_update.gst_number is not None:
        if config_update.gst_number and not validate_gstin(config_update.gst_number):
            raise HTTPException(status_code=400, detail="Invalid GSTIN Format")
        tenant.gst_number = config_update.gst_number
    if config_update.state is not None:
        tenant.state = config_update.state
    if config_update.inventory_mode is not None:
        tenant.inventory_mode = config_update.inventory_mode
    if config_update.ai_model is not None:
        tenant.ai_model = config_update.ai_model
        
    db.commit()
    db.refresh(tenant)
    return tenant
