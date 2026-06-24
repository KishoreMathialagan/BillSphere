import re

with open('c:/Users/Lenovo/Downloads/BillSphere/backend/app/api/v1/sales.py', 'r', encoding='utf-8') as f:
    sales_code = f.read()

# We need to inject our tax engine logic into checkout_pos
new_sales_code = """from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from decimal import Decimal
from app.db.session import get_db
from app.models.customer import Customer
from app.models.sales import Invoice, InvoiceItem
from app.models.inventory import Inventory, StockAdjustment, ProductVariant
from app.models.tenant import Tenant
from app.models.user import User
from app.models.inventory import InventoryException
from app.models.audit import AuditLog
from app.schemas.customer import InvoiceCreate, InvoiceResponse
from app.schemas.sync import SyncPayload, SyncResponse
from app.api.dependencies import get_current_user
from app.services.tax_engine import calculate_line_item, calculate_invoice_totals

router = APIRouter()

@router.post("/checkout", response_model=InvoiceResponse)
def checkout_pos(invoice: InvoiceCreate, customer_id: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tenant = db.query(Tenant).filter(Tenant.tenant_id == current_user.tenant_id).first()
    if not tenant or not tenant.state:
        raise HTTPException(status_code=400, detail="Company state must be configured for GST calculation.")

    customer = None
    buyer_state = tenant.state
    if customer_id:
        customer = db.query(Customer).filter(
            Customer.customer_id == customer_id,
            Customer.tenant_id == current_user.tenant_id
        ).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        if not customer.state:
            raise HTTPException(status_code=400, detail="Customer state must be configured for GST calculation.")
        buyer_state = customer.state

        # Credit limit check
        # Assuming outstanding_amount from frontend is accurate for payment logic
        # But we will recalculate the invoice totals anyway
        invoices = db.query(Invoice).filter(Invoice.customer_id == customer.customer_id).all()
        computed_balance = sum(Decimal(str(inv.outstanding_amount)) for inv in invoices)
        available_credit = Decimal(str(customer.credit_limit)) - computed_balance

    # Recalculate line items server-side
    processed_items = []
    line_item_models = []
    total_cogs = Decimal("0.00")

    for item in invoice.items:
        calc_result = calculate_line_item(
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount_type=item.discount_type,
            discount_value=item.discount_value,
            gst_rate=item.gst_rate,
            is_inclusive=invoice.is_tax_inclusive,
            seller_state=tenant.state,
            buyer_state=buyer_state
        )
        processed_items.append(calc_result)

        db_item = InvoiceItem(
            variant_id=item.variant_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount_type=item.discount_type,
            discount_value=item.discount_value,
            hsn_code=item.hsn_code,
            **calc_result
        )
        line_item_models.append((item.variant_id, item.quantity, db_item))

        variant = db.query(ProductVariant).filter(ProductVariant.variant_id == item.variant_id).first()
        cogs = (Decimal(str(variant.purchase_price)) * item.quantity) if variant else Decimal("0.00")
        total_cogs += cogs

    totals = calculate_invoice_totals(processed_items)
    
    # Check credit limit against recalculated total
    frontend_paid = invoice.total_amount - invoice.outstanding_amount # How much they claimed to pay
    if frontend_paid < 0: frontend_paid = 0
    frontend_paid_dec = Decimal(str(frontend_paid))
    
    outstanding_amount = totals["total_amount"] - frontend_paid_dec
    if outstanding_amount < Decimal("0.00"):
        outstanding_amount = Decimal("0.00")

    if customer and outstanding_amount > Decimal("0.00"):
        if outstanding_amount > available_credit:
            raise HTTPException(
                status_code=400,
                detail=f"Credit limit exceeded. Available: {available_credit}, Required: {outstanding_amount}."
            )

    db_invoice = Invoice(
        tenant_id=current_user.tenant_id,
        branch_id=invoice.branch_id,
        customer_id=customer_id,
        invoice_number=invoice.invoice_number,
        is_tax_inclusive=invoice.is_tax_inclusive,
        tax_mode=invoice.tax_mode,
        status=invoice.status,
        place_of_supply=invoice.place_of_supply,
        eway_bill_number=invoice.eway_bill_number,
        transporter_name=invoice.transporter_name,
        vehicle_number=invoice.vehicle_number,
        outstanding_amount=outstanding_amount,
        **totals
    )
    db.add(db_invoice)
    db.flush()

    for variant_id, quantity, db_item in line_item_models:
        db_item.invoice_id = db_invoice.invoice_id
        db.add(db_item)
        
        # Decrement Inventory
        inv = db.query(Inventory).filter(
            Inventory.tenant_id == current_user.tenant_id,
            Inventory.branch_id == invoice.branch_id,
            Inventory.variant_id == variant_id
        ).first()
        
        if not inv:
            inv = Inventory(
                tenant_id=current_user.tenant_id,
                branch_id=invoice.branch_id,
                variant_id=variant_id,
                quantity=0
            )
            db.add(inv)
            db.flush()
            
        inv.quantity -= quantity
        
        adj = StockAdjustment(
            tenant_id=current_user.tenant_id,
            branch_id=invoice.branch_id,
            variant_id=variant_id,
            quantity_change=-quantity,
            reason=f"Sale {invoice.invoice_number}"
        )
        db.add(adj)
    
    # Auto-Post Journal Entry
    from app.services.accounting import post_system_journal
    cash_amount = totals["total_amount"] - outstanding_amount
    receivable_amount = outstanding_amount
    revenue_amount = totals["total_amount"] - totals["total_tax"]
    
    entries = []
    if cash_amount > 0:
        entries.append({"tag": "CASH", "debit": float(cash_amount)})
    if receivable_amount > 0:
        entries.append({"tag": "AR", "debit": float(receivable_amount)})
    entries.append({"tag": "SALES", "credit": float(revenue_amount)})
    
    if total_cogs > 0:
        entries.append({"tag": "COGS", "debit": float(total_cogs)})
        entries.append({"tag": "INVENTORY", "credit": float(total_cogs)})
    
    if totals["total_cgst"] > 0:
        entries.append({"tag": "CGST_OUT", "credit": float(totals["total_cgst"])})
    if totals["total_sgst"] > 0:
        entries.append({"tag": "SGST_OUT", "credit": float(totals["total_sgst"])})
    if totals["total_igst"] > 0:
        entries.append({"tag": "IGST_OUT", "credit": float(totals["total_igst"])})

    post_system_journal(
        db=db,
        tenant_id=current_user.tenant_id,
        entry_date=datetime.datetime.utcnow(),
        reference=db_invoice.invoice_number,
        description=f"Sales Invoice {db_invoice.invoice_number}",
        source_entity="Invoice",
        source_id=db_invoice.invoice_id,
        entries=entries,
        user_id=current_user.user_id
    )

    db.commit()
    db.refresh(db_invoice)
    return db_invoice

@router.get("/invoices", response_model=List[InvoiceResponse])
def get_all_invoices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Invoice).filter(
        Invoice.tenant_id == current_user.tenant_id
    ).order_by(Invoice.created_at.desc()).all()

@router.post("/sync", response_model=SyncResponse)
def sync_offline_invoices(payload: SyncPayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tenant = db.query(Tenant).filter(Tenant.tenant_id == current_user.tenant_id).first()
    inventory_mode = tenant.inventory_mode if tenant else "Strict"
    
    synced_count = 0
    exceptions_count = 0

    for invoice_data in payload.invoices:
        existing = db.query(Invoice).filter(
            Invoice.tenant_id == current_user.tenant_id,
            Invoice.invoice_number == invoice_data.invoice_number
        ).first()
        if existing:
            continue
            
        customer = None
        buyer_state = tenant.state
        if invoice_data.customer_id:
            customer = db.query(Customer).filter(
                Customer.customer_id == invoice_data.customer_id,
                Customer.tenant_id == current_user.tenant_id
            ).first()
            if customer and customer.state:
                buyer_state = customer.state

        # Recalculate
        processed_items = []
        line_item_models = []
        total_cogs = Decimal("0.00")

        for item in invoice_data.items:
            calc_result = calculate_line_item(
                quantity=item.quantity,
                unit_price=item.unit_price,
                discount_type=item.discount_type,
                discount_value=item.discount_value,
                gst_rate=item.gst_rate,
                is_inclusive=invoice_data.is_tax_inclusive,
                seller_state=tenant.state,
                buyer_state=buyer_state
            )
            processed_items.append(calc_result)

            db_item = InvoiceItem(
                variant_id=item.variant_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                discount_type=item.discount_type,
                discount_value=item.discount_value,
                hsn_code=item.hsn_code,
                **calc_result
            )
            line_item_models.append((item.variant_id, item.quantity, db_item))
            
            variant = db.query(ProductVariant).filter(ProductVariant.variant_id == item.variant_id).first()
            cogs = (Decimal(str(variant.purchase_price)) * item.quantity) if variant else Decimal("0.00")
            total_cogs += cogs

        totals = calculate_invoice_totals(processed_items)
        
        frontend_paid = invoice_data.total_amount - invoice_data.outstanding_amount
        if frontend_paid < 0: frontend_paid = 0
        frontend_paid_dec = Decimal(str(frontend_paid))
        
        outstanding_amount = totals["total_amount"] - frontend_paid_dec
        if outstanding_amount < Decimal("0.00"):
            outstanding_amount = Decimal("0.00")

        db_invoice = Invoice(
            tenant_id=current_user.tenant_id,
            branch_id=invoice_data.branch_id,
            customer_id=invoice_data.customer_id,
            invoice_number=invoice_data.invoice_number,
            is_tax_inclusive=invoice_data.is_tax_inclusive,
            tax_mode=invoice_data.tax_mode,
            status=invoice_data.status,
            place_of_supply=invoice_data.place_of_supply,
            eway_bill_number=invoice_data.eway_bill_number,
            transporter_name=invoice_data.transporter_name,
            vehicle_number=invoice_data.vehicle_number,
            outstanding_amount=outstanding_amount,
            created_at=invoice_data.offline_created_at or datetime.datetime.utcnow(),
            **totals
        )
        db.add(db_invoice)
        db.flush()
        
        for variant_id, quantity, db_item in line_item_models:
            db_item.invoice_id = db_invoice.invoice_id
            db.add(db_item)
            
            # Inventory processing
            inv = db.query(Inventory).filter(
                Inventory.tenant_id == current_user.tenant_id,
                Inventory.branch_id == invoice_data.branch_id,
                Inventory.variant_id == variant_id
            ).first()
            
            if not inv:
                inv = Inventory(
                    tenant_id=current_user.tenant_id,
                    branch_id=invoice_data.branch_id,
                    variant_id=variant_id,
                    quantity=0
                )
                db.add(inv)
                db.flush()
                
            expected_stock = inv.quantity
            inv.quantity -= quantity
            actual_stock = inv.quantity
            
            adj = StockAdjustment(
                tenant_id=current_user.tenant_id,
                branch_id=invoice_data.branch_id,
                variant_id=variant_id,
                quantity_change=-quantity,
                reason=f"Offline Sale Sync {invoice_data.invoice_number}"
            )
            db.add(adj)
            
            if actual_stock < 0:
                exc = InventoryException(
                    tenant_id=current_user.tenant_id,
                    branch_id=invoice_data.branch_id,
                    variant_id=variant_id,
                    expected_stock=expected_stock,
                    actual_stock=actual_stock,
                    difference=-quantity,
                    user_id=current_user.user_id,
                    status="Pending"
                )
                db.add(exc)
                exceptions_count += 1
                
                audit = AuditLog(
                    tenant_id=current_user.tenant_id,
                    user_id=current_user.user_id,
                    action="INVENTORY_EXCEPTION",
                    entity="Inventory",
                    details=f"Stock for variant {variant_id} went negative ({actual_stock}) after offline sync of invoice {invoice_data.invoice_number}"
                )
                db.add(audit)

        from app.services.accounting import post_system_journal
        cash_amount = totals["total_amount"] - outstanding_amount
        receivable_amount = outstanding_amount
        revenue_amount = totals["total_amount"] - totals["total_tax"]
        
        entries = []
        if cash_amount > 0:
            entries.append({"tag": "CASH", "debit": float(cash_amount)})
        if receivable_amount > 0:
            entries.append({"tag": "AR", "debit": float(receivable_amount)})
        
        entries.append({"tag": "SALES", "credit": float(revenue_amount)})
        
        if total_cogs > 0:
            entries.append({"tag": "COGS", "debit": float(total_cogs)})
            entries.append({"tag": "INVENTORY", "credit": float(total_cogs)})
        
        if totals["total_cgst"] > 0:
            entries.append({"tag": "CGST_OUT", "credit": float(totals["total_cgst"])})
        if totals["total_sgst"] > 0:
            entries.append({"tag": "SGST_OUT", "credit": float(totals["total_sgst"])})
        if totals["total_igst"] > 0:
            entries.append({"tag": "IGST_OUT", "credit": float(totals["total_igst"])})

        post_system_journal(
            db=db,
            tenant_id=current_user.tenant_id,
            entry_date=db_invoice.created_at,
            reference=db_invoice.invoice_number,
            description=f"Offline Sync Invoice {db_invoice.invoice_number}",
            source_entity="Invoice",
            source_id=db_invoice.invoice_id,
            entries=entries,
            user_id=current_user.user_id
        )

        synced_count += 1

    db.commit()
    return SyncResponse(status="success", synced_invoices=synced_count, exceptions_created=exceptions_count)
"""

with open('c:/Users/Lenovo/Downloads/BillSphere/backend/app/api/v1/sales.py', 'w', encoding='utf-8') as f:
    f.write(new_sales_code)
