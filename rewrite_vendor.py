import re

with open('c:/Users/Lenovo/Downloads/BillSphere/backend/app/api/v1/vendor.py', 'r', encoding='utf-8') as f:
    vendor_code = f.read()

new_vendor_code = """from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import datetime
from decimal import Decimal
from app.db.session import get_db
from app.models.vendor import Vendor
from app.models.tenant import Tenant
from app.models.purchases import Purchase, PurchaseItem
from app.models.inventory import Inventory, StockAdjustment
from app.models.user import User
from app.schemas.vendor import (
    VendorCreate, VendorUpdate, VendorResponse,
    PurchaseCreate, PurchaseResponse, VendorPaymentCreate
)
from app.api.dependencies import get_current_user
from app.services.ocr_service import extract_invoice_data
from app.services.tax_engine import calculate_line_item, calculate_invoice_totals

router = APIRouter()

@router.post("/ocr-extract")
async def extract_invoice_ocr(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are currently supported for OCR.")
        
    try:
        image_bytes = await file.read()
        
        tenant = db.query(Tenant).filter(Tenant.tenant_id == current_user.tenant_id).first()
        ai_model = tenant.ai_model if tenant else "qwen/qwen-2.5-7b-instruct"
        
        structured_data = extract_invoice_data(image_bytes, ai_model)
        
        if "error" in structured_data:
            raise HTTPException(status_code=400, detail=structured_data["error"])
            
        return structured_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

@router.get("", response_model=List[VendorResponse])
def get_vendors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vendors = db.query(Vendor).filter(Vendor.tenant_id == current_user.tenant_id).all()
    for v in vendors:
        purchases = db.query(Purchase).filter(Purchase.vendor_id == v.vendor_id).all()
        v.outstanding_balance = sum(p.outstanding_amount for p in purchases)
    return vendors

@router.post("", response_model=VendorResponse)
def create_vendor(vendor: VendorCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_vendor = Vendor(
        tenant_id=current_user.tenant_id,
        name=vendor.name,
        phone=vendor.phone,
        email=vendor.email,
        address=vendor.address,
        state=vendor.state,
        gst_number=vendor.gst_number,
        outstanding_balance=vendor.outstanding_balance
    )
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor

@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(vendor_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vendor = db.query(Vendor).filter(
        Vendor.vendor_id == vendor_id,
        Vendor.tenant_id == current_user.tenant_id
    ).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    purchases = db.query(Purchase).filter(Purchase.vendor_id == vendor.vendor_id).all()
    vendor.outstanding_balance = sum(p.outstanding_amount for p in purchases)
    
    return vendor

@router.put("/{vendor_id}", response_model=VendorResponse)
def update_vendor(vendor_id: str, vendor_data: VendorUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vendor = db.query(Vendor).filter(
        Vendor.vendor_id == vendor_id,
        Vendor.tenant_id == current_user.tenant_id
    ).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    vendor.name = vendor_data.name
    vendor.phone = vendor_data.phone
    vendor.email = vendor_data.email
    vendor.address = vendor_data.address
    vendor.state = vendor_data.state
    vendor.gst_number = vendor_data.gst_number
    
    db.commit()
    db.refresh(vendor)
    return vendor

@router.delete("/{vendor_id}")
def delete_vendor(vendor_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vendor = db.query(Vendor).filter(
        Vendor.vendor_id == vendor_id,
        Vendor.tenant_id == current_user.tenant_id
    ).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    db.delete(vendor)
    db.commit()
    return {"detail": "Vendor deleted successfully"}

@router.get("/{vendor_id}/purchases", response_model=List[PurchaseResponse])
def get_vendor_purchases(vendor_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vendor = db.query(Vendor).filter(
        Vendor.vendor_id == vendor_id,
        Vendor.tenant_id == current_user.tenant_id
    ).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    return db.query(Purchase).filter(
        Purchase.vendor_id == vendor_id,
        Purchase.tenant_id == current_user.tenant_id
    ).order_by(Purchase.created_at.desc()).all()

@router.post("/{vendor_id}/purchases", response_model=PurchaseResponse)
def add_vendor_purchase(vendor_id: str, purchase: PurchaseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tenant = db.query(Tenant).filter(Tenant.tenant_id == current_user.tenant_id).first()
    if not tenant or not tenant.state:
        raise HTTPException(status_code=400, detail="Company state must be configured for GST calculation.")

    vendor = db.query(Vendor).filter(
        Vendor.vendor_id == vendor_id,
        Vendor.tenant_id == current_user.tenant_id
    ).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if not vendor.state:
        raise HTTPException(status_code=400, detail="Vendor state must be configured for GST calculation.")

    processed_items = []
    line_item_models = []

    for item in purchase.items:
        calc_result = calculate_line_item(
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount_type=item.discount_type,
            discount_value=item.discount_value,
            gst_rate=item.gst_rate,
            is_inclusive=purchase.is_tax_inclusive,
            seller_state=vendor.state,
            buyer_state=tenant.state
        )
        processed_items.append(calc_result)

        db_item = PurchaseItem(
            variant_id=item.variant_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount_type=item.discount_type,
            discount_value=item.discount_value,
            hsn_code=item.hsn_code,
            **calc_result
        )
        line_item_models.append((item.variant_id, item.quantity, db_item))

    totals = calculate_invoice_totals(processed_items)
    
    # Calculate outstanding based on paid amount from frontend
    frontend_paid = purchase.total_amount - purchase.outstanding_amount
    if frontend_paid < 0: frontend_paid = 0
    frontend_paid_dec = Decimal(str(frontend_paid))
    
    outstanding_amount = totals["total_amount"] - frontend_paid_dec
    if outstanding_amount < Decimal("0.00"):
        outstanding_amount = Decimal("0.00")

    db_purchase = Purchase(
        tenant_id=current_user.tenant_id,
        branch_id=purchase.branch_id,
        vendor_id=vendor_id,
        purchase_number=purchase.purchase_number,
        is_tax_inclusive=purchase.is_tax_inclusive,
        tax_mode=purchase.tax_mode,
        place_of_supply=purchase.place_of_supply,
        eway_bill_number=purchase.eway_bill_number,
        transporter_name=purchase.transporter_name,
        vehicle_number=purchase.vehicle_number,
        status=purchase.status,
        outstanding_amount=outstanding_amount,
        **totals
    )
    db.add(db_purchase)
    db.flush()
    
    for variant_id, quantity, db_item in line_item_models:
        db_item.purchase_id = db_purchase.purchase_id
        db.add(db_item)
        
        # Update Inventory
        inv = db.query(Inventory).filter(
            Inventory.tenant_id == current_user.tenant_id,
            Inventory.branch_id == purchase.branch_id,
            Inventory.variant_id == variant_id
        ).first()
        
        if not inv:
            inv = Inventory(
                tenant_id=current_user.tenant_id,
                branch_id=purchase.branch_id,
                variant_id=variant_id,
                quantity=0
            )
            db.add(inv)
            db.flush()
            
        inv.quantity += quantity
        
        adj = StockAdjustment(
            tenant_id=current_user.tenant_id,
            branch_id=purchase.branch_id,
            variant_id=variant_id,
            quantity_change=quantity,
            reason=f"Purchase {purchase.purchase_number}"
        )
        db.add(adj)
    
    # Auto-Post Journal Entry
    from app.services.accounting import post_system_journal
    import datetime
    
    cash_paid = totals["total_amount"] - outstanding_amount
    
    entries = []
    purchase_cost = totals["total_amount"] - totals["total_tax"]
    entries.append({"tag": "INVENTORY", "debit": float(purchase_cost)})
    
    if totals["total_cgst"] > 0:
        entries.append({"tag": "CGST_IN", "debit": float(totals["total_cgst"])})
    if totals["total_sgst"] > 0:
        entries.append({"tag": "SGST_IN", "debit": float(totals["total_sgst"])})
    if totals["total_igst"] > 0:
        entries.append({"tag": "IGST_IN", "debit": float(totals["total_igst"])})
    
    if cash_paid > 0:
        entries.append({"tag": "CASH", "credit": float(cash_paid)})
    if outstanding_amount > 0:
        entries.append({"tag": "AP", "credit": float(outstanding_amount)})

    post_system_journal(
        db=db,
        tenant_id=current_user.tenant_id,
        entry_date=datetime.datetime.utcnow(),
        reference=db_purchase.purchase_number,
        description=f"Purchase Invoice {db_purchase.purchase_number}",
        source_entity="Purchase",
        source_id=db_purchase.purchase_id,
        entries=entries,
        user_id=current_user.user_id
    )
    
    db.commit()
    db.refresh(db_purchase)
    return db_purchase

@router.get("/all/history", response_model=List[PurchaseResponse])
def get_all_purchases(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Purchase).filter(
        Purchase.tenant_id == current_user.tenant_id
    ).order_by(Purchase.created_at.desc()).all()

@router.post("/{vendor_id}/payments", response_model=VendorResponse)
def pay_vendor_outstanding(vendor_id: str, payment: VendorPaymentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vendor = db.query(Vendor).filter(
        Vendor.vendor_id == vendor_id,
        Vendor.tenant_id == current_user.tenant_id
    ).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    vendor.outstanding_balance = max(Decimal("0.00"), vendor.outstanding_balance - payment.amount)
    
    db_purchase = Purchase(
        tenant_id=current_user.tenant_id,
        vendor_id=vendor_id,
        purchase_number=f"PAY-{int(datetime.datetime.utcnow().timestamp())}",
        total_amount=-payment.amount,
        outstanding_amount=-payment.amount,
        status="Paid"
    )
    db.add(db_purchase)
    db.flush()
    
    from app.services.accounting import post_system_journal
    post_system_journal(
        db=db,
        tenant_id=current_user.tenant_id,
        entry_date=datetime.datetime.utcnow(),
        reference=db_purchase.purchase_number,
        description=f"Payment to Vendor {vendor.name}",
        source_entity="VendorPayment",
        source_id=db_purchase.purchase_id,
        entries=[
            {"tag": "AP", "debit": float(payment.amount)},
            {"tag": "CASH", "credit": float(payment.amount)}
        ],
        user_id=current_user.user_id
    )

    db.commit()
    db.refresh(vendor)
    return vendor
"""

with open('c:/Users/Lenovo/Downloads/BillSphere/backend/app/api/v1/vendor.py', 'w', encoding='utf-8') as f:
    f.write(new_vendor_code)
