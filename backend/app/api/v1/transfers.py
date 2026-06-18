from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import datetime
from app.db.session import get_db
from app.models.branch import InterBranchTransfer, TransferItem
from app.models.inventory import Inventory, StockAdjustment, InventoryException
from app.models.user import User
from app.models.tenant import Tenant
from app.models.audit import AuditLog
from app.schemas.transfer import TransferCreate, TransferResponse
from app.api.dependencies import get_current_user

router = APIRouter()

@router.post("/", response_model=TransferResponse)
def create_transfer(transfer: TransferCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if transfer.from_branch_id == transfer.to_branch_id:
        raise HTTPException(status_code=400, detail="Cannot transfer to the same branch")

    db_transfer = InterBranchTransfer(
        tenant_id=current_user.tenant_id,
        from_branch_id=transfer.from_branch_id,
        to_branch_id=transfer.to_branch_id,
        status="Pending",
        created_by_user_id=current_user.user_id
    )
    db.add(db_transfer)
    db.flush()

    for item in transfer.items:
        db_item = TransferItem(
            transfer_id=db_transfer.transfer_id,
            variant_id=item.variant_id,
            quantity=item.quantity
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_transfer)
    return db_transfer

@router.get("/", response_model=List[TransferResponse])
def get_transfers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(InterBranchTransfer).filter(
        InterBranchTransfer.tenant_id == current_user.tenant_id
    ).order_by(InterBranchTransfer.created_at.desc()).all()

@router.post("/{transfer_id}/dispatch", response_model=TransferResponse)
def dispatch_transfer(transfer_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transfer = db.query(InterBranchTransfer).filter(
        InterBranchTransfer.transfer_id == transfer_id,
        InterBranchTransfer.tenant_id == current_user.tenant_id
    ).first()

    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    if transfer.status != "Pending":
        raise HTTPException(status_code=400, detail="Only Pending transfers can be dispatched")

    tenant = db.query(Tenant).filter(Tenant.tenant_id == current_user.tenant_id).first()
    inventory_mode = tenant.inventory_mode if tenant else "Strict"

    # Deduct stock from origin branch
    for item in transfer.items:
        inv = db.query(Inventory).filter(
            Inventory.tenant_id == current_user.tenant_id,
            Inventory.branch_id == transfer.from_branch_id,
            Inventory.variant_id == item.variant_id
        ).first()

        if not inv:
            inv = Inventory(tenant_id=current_user.tenant_id, branch_id=transfer.from_branch_id, variant_id=item.variant_id, quantity=0)
            db.add(inv)
            db.flush()

        if inventory_mode == "Strict" and inv.quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for variant {item.variant_id} at origin branch")

        expected_stock = inv.quantity
        inv.quantity -= item.quantity

        # Create Adjustment Log
        adj = StockAdjustment(
            tenant_id=current_user.tenant_id,
            branch_id=transfer.from_branch_id,
            variant_id=item.variant_id,
            quantity_change=-item.quantity,
            reason=f"Transfer Dispatch {transfer.transfer_id}"
        )
        db.add(adj)

        if inv.quantity < 0:
            exc = InventoryException(
                tenant_id=current_user.tenant_id, branch_id=transfer.from_branch_id, variant_id=item.variant_id,
                expected_stock=expected_stock, actual_stock=inv.quantity, difference=-item.quantity,
                user_id=current_user.user_id, status="Pending"
            )
            db.add(exc)
            
            audit = AuditLog(
                tenant_id=current_user.tenant_id, user_id=current_user.user_id,
                action="INVENTORY_EXCEPTION", entity="Transfer",
                details=f"Stock went negative during transfer dispatch {transfer.transfer_id}"
            )
            db.add(audit)

    transfer.status = "In-Transit"
    db.commit()
    db.refresh(transfer)
    return transfer

@router.post("/{transfer_id}/receive", response_model=TransferResponse)
def receive_transfer(transfer_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transfer = db.query(InterBranchTransfer).filter(
        InterBranchTransfer.transfer_id == transfer_id,
        InterBranchTransfer.tenant_id == current_user.tenant_id
    ).first()

    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    if transfer.status != "In-Transit":
        raise HTTPException(status_code=400, detail="Only In-Transit transfers can be received")

    # Add stock to destination branch
    for item in transfer.items:
        inv = db.query(Inventory).filter(
            Inventory.tenant_id == current_user.tenant_id,
            Inventory.branch_id == transfer.to_branch_id,
            Inventory.variant_id == item.variant_id
        ).first()

        if not inv:
            inv = Inventory(tenant_id=current_user.tenant_id, branch_id=transfer.to_branch_id, variant_id=item.variant_id, quantity=0)
            db.add(inv)
            db.flush()

        inv.quantity += item.quantity

        adj = StockAdjustment(
            tenant_id=current_user.tenant_id,
            branch_id=transfer.to_branch_id,
            variant_id=item.variant_id,
            quantity_change=item.quantity,
            reason=f"Transfer Received {transfer.transfer_id}"
        )
        db.add(adj)

    transfer.status = "Completed"
    transfer.received_at = datetime.datetime.utcnow()
    transfer.received_by_user_id = current_user.user_id
    
    db.commit()
    db.refresh(transfer)
    return transfer
