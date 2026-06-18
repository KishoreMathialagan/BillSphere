from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from app.db.session import get_db
from app.models.customer import Customer
from app.models.sales import Invoice, InvoiceItem
from app.models.inventory import Inventory, StockAdjustment
from app.models.user import User
from app.schemas.customer import InvoiceCreate, InvoiceResponse
from app.api.dependencies import get_current_user

router = APIRouter()

@router.post("/checkout", response_model=InvoiceResponse)
def checkout_pos(invoice: InvoiceCreate, customer_id: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = None
    if customer_id:
        customer = db.query(Customer).filter(
            Customer.customer_id == customer_id,
            Customer.tenant_id == current_user.tenant_id
        ).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        # Credit limit check
        if invoice.outstanding_amount > 0:
            # Dynamically compute outstanding balance
            invoices = db.query(Invoice).filter(Invoice.customer_id == customer.customer_id).all()
            computed_balance = sum(inv.outstanding_amount for inv in invoices)
            
            available_credit = customer.credit_limit - computed_balance
            if invoice.outstanding_amount > available_credit:
                raise HTTPException(
                    status_code=400,
                    detail=f"Credit limit exceeded. Customer has {available_credit:.2f} available credit but invoice outstanding is {invoice.outstanding_amount:.2f}."
                )
    
    db_invoice = Invoice(
        tenant_id=current_user.tenant_id,
        branch_id=invoice.branch_id,
        customer_id=customer_id,
        invoice_number=invoice.invoice_number,
        total_amount=invoice.total_amount,
        outstanding_amount=invoice.outstanding_amount,
        total_tax=invoice.total_tax,
        total_cgst=invoice.total_cgst,
        total_sgst=invoice.total_sgst,
        total_igst=invoice.total_igst,
        total_discount=invoice.total_discount,
        place_of_supply=invoice.place_of_supply,
        eway_bill_number=invoice.eway_bill_number,
        transporter_name=invoice.transporter_name,
        vehicle_number=invoice.vehicle_number,
        status=invoice.status
    )
    db.add(db_invoice)
    db.flush()
    
    total_cogs = 0.0
    for item in invoice.items:
        db_item = InvoiceItem(
            invoice_id=db_invoice.invoice_id,
            variant_id=item.variant_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount_amount=item.discount_amount,
            hsn_code=item.hsn_code,
            tax_rate=item.tax_rate,
            tax_amount=item.tax_amount,
            cgst_amount=item.cgst_amount,
            sgst_amount=item.sgst_amount,
            igst_amount=item.igst_amount,
            subtotal=item.subtotal
        )
        db.add(db_item)
        
        # Calculate COGS
        from app.models.inventory import ProductVariant
        variant = db.query(ProductVariant).filter(ProductVariant.variant_id == item.variant_id).first()
        cogs = (variant.purchase_price * item.quantity) if variant else 0.0
        total_cogs += cogs
        
        # Decrement Inventory
        inv = db.query(Inventory).filter(
            Inventory.tenant_id == current_user.tenant_id,
            Inventory.branch_id == invoice.branch_id,
            Inventory.variant_id == item.variant_id
        ).first()
        
        if not inv:
            inv = Inventory(
                tenant_id=current_user.tenant_id,
                branch_id=invoice.branch_id,
                variant_id=item.variant_id,
                quantity=0
            )
            db.add(inv)
            db.flush()
            
        inv.quantity -= item.quantity
        
        adj = StockAdjustment(
            tenant_id=current_user.tenant_id,
            branch_id=invoice.branch_id,
            variant_id=item.variant_id,
            quantity_change=-item.quantity,
            reason=f"Sale {invoice.invoice_number}"
        )
        db.add(adj)
    
    # Outstanding balance is dynamically computed instead of being stored manually
    
    # Auto-Post Journal Entry
    from app.services.accounting import post_system_journal
    cash_amount = invoice.total_amount - invoice.outstanding_amount
    receivable_amount = invoice.outstanding_amount
    revenue_amount = invoice.total_amount - invoice.total_tax
    
    entries = []
    if cash_amount > 0:
        entries.append({"tag": "CASH", "debit": cash_amount})
    if receivable_amount > 0:
        entries.append({"tag": "AR", "debit": receivable_amount})
    entries.append({"tag": "SALES", "credit": revenue_amount})
    
    if total_cogs > 0:
        entries.append({"tag": "COGS", "debit": total_cogs})
        entries.append({"tag": "INVENTORY", "credit": total_cogs})
    
    if invoice.total_cgst > 0:
        entries.append({"tag": "CGST_OUT", "credit": invoice.total_cgst})
    if invoice.total_sgst > 0:
        entries.append({"tag": "SGST_OUT", "credit": invoice.total_sgst})
    if invoice.total_igst > 0:
        entries.append({"tag": "IGST_OUT", "credit": invoice.total_igst})

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

from app.schemas.sync import SyncPayload, SyncResponse
from app.models.tenant import Tenant
from app.models.inventory import InventoryException
from app.models.audit import AuditLog

@router.post("/sync", response_model=SyncResponse)
def sync_offline_invoices(payload: SyncPayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tenant = db.query(Tenant).filter(Tenant.tenant_id == current_user.tenant_id).first()
    inventory_mode = tenant.inventory_mode if tenant else "Strict"
    
    synced_count = 0
    exceptions_count = 0

    for invoice_data in payload.invoices:
        # Check if already synced (prevent duplicates by invoice_number)
        existing = db.query(Invoice).filter(
            Invoice.tenant_id == current_user.tenant_id,
            Invoice.invoice_number == invoice_data.invoice_number
        ).first()
        if existing:
            continue
            
        # Process Customer
        # (Assuming the payload handles customer creation or passes a valid customer_id)
        # We will skip strict credit limit checks here as per ADR "Offline sales are always accepted"
        # However, we must update the outstanding balance
        if invoice_data.customer_id:
            customer = db.query(Customer).filter(
                Customer.customer_id == invoice_data.customer_id,
                Customer.tenant_id == current_user.tenant_id
            ).first()
            # outstanding_balance is calculated dynamically per architecture constraint

        db_invoice = Invoice(
            tenant_id=current_user.tenant_id,
            branch_id=invoice_data.branch_id,
            customer_id=invoice_data.customer_id,
            invoice_number=invoice_data.invoice_number,
            total_amount=invoice_data.total_amount,
            outstanding_amount=invoice_data.outstanding_amount,
            total_tax=invoice_data.total_tax,
            total_cgst=invoice_data.total_cgst,
            total_sgst=invoice_data.total_sgst,
            total_igst=invoice_data.total_igst,
            total_discount=invoice_data.total_discount,
            place_of_supply=invoice_data.place_of_supply,
            eway_bill_number=invoice_data.eway_bill_number,
            transporter_name=invoice_data.transporter_name,
            vehicle_number=invoice_data.vehicle_number,
            status=invoice_data.status,
            created_at=invoice_data.offline_created_at or datetime.datetime.utcnow()
        )
        db.add(db_invoice)
        db.flush()
        
        total_cogs = 0.0
        for item in invoice_data.items:
            db_item = InvoiceItem(
                invoice_id=db_invoice.invoice_id,
                variant_id=item.variant_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                discount_amount=item.discount_amount,
                hsn_code=item.hsn_code,
                tax_rate=item.tax_rate,
                tax_amount=item.tax_amount,
                cgst_amount=item.cgst_amount,
                sgst_amount=item.sgst_amount,
                igst_amount=item.igst_amount,
                subtotal=item.subtotal
            )
            db.add(db_item)
            
            from app.models.inventory import ProductVariant
            variant = db.query(ProductVariant).filter(ProductVariant.variant_id == item.variant_id).first()
            cogs = (variant.purchase_price * item.quantity) if variant else 0.0
            total_cogs += cogs
            
            # Inventory processing
            inv = db.query(Inventory).filter(
                Inventory.tenant_id == current_user.tenant_id,
                Inventory.branch_id == invoice_data.branch_id,
                Inventory.variant_id == item.variant_id
            ).first()
            
            if not inv:
                inv = Inventory(
                    tenant_id=current_user.tenant_id,
                    branch_id=invoice_data.branch_id,
                    variant_id=item.variant_id,
                    quantity=0
                )
                db.add(inv)
                db.flush()
                
            expected_stock = inv.quantity
            inv.quantity -= item.quantity
            actual_stock = inv.quantity
            
            adj = StockAdjustment(
                tenant_id=current_user.tenant_id,
                branch_id=invoice_data.branch_id,
                variant_id=item.variant_id,
                quantity_change=-item.quantity,
                reason=f"Offline Sale Sync {invoice_data.invoice_number}"
            )
            db.add(adj)
            
            if actual_stock < 0:
                # Create exception
                exc = InventoryException(
                    tenant_id=current_user.tenant_id,
                    branch_id=invoice_data.branch_id,
                    variant_id=item.variant_id,
                    expected_stock=expected_stock,
                    actual_stock=actual_stock,
                    difference=-item.quantity,
                    user_id=current_user.user_id,
                    status="Pending"
                )
                db.add(exc)
                exceptions_count += 1
                
                # Audit log
                audit = AuditLog(
                    tenant_id=current_user.tenant_id,
                    user_id=current_user.user_id,
                    action="INVENTORY_EXCEPTION",
                    entity="Inventory",
                    details=f"Stock for variant {item.variant_id} went negative ({actual_stock}) after offline sync of invoice {invoice_data.invoice_number}"
                )
                db.add(audit)

        # Auto-Post Journal Entry for Synced Invoice
        from app.services.accounting import post_system_journal
        cash_amount = invoice_data.total_amount - invoice_data.outstanding_amount
        receivable_amount = invoice_data.outstanding_amount
        revenue_amount = invoice_data.total_amount - invoice_data.total_tax
        
        entries = []
        if cash_amount > 0:
            entries.append({"tag": "CASH", "debit": cash_amount})
        if receivable_amount > 0:
            entries.append({"tag": "AR", "debit": receivable_amount})
        
        entries.append({"tag": "SALES", "credit": revenue_amount})
        
        if total_cogs > 0:
            entries.append({"tag": "COGS", "debit": total_cogs})
            entries.append({"tag": "INVENTORY", "credit": total_cogs})
        
        if invoice_data.total_cgst > 0:
            entries.append({"tag": "CGST_OUT", "credit": invoice_data.total_cgst})
        if invoice_data.total_sgst > 0:
            entries.append({"tag": "SGST_OUT", "credit": invoice_data.total_sgst})
        if invoice_data.total_igst > 0:
            entries.append({"tag": "IGST_OUT", "credit": invoice_data.total_igst})

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
