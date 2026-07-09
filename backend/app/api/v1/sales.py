from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from decimal import Decimal
from app.db import session
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
    seller_state = tenant.state
    if not seller_state:
        raise HTTPException(status_code=400, detail="Seller state must be configured for GST calculation.")
        
    buyer_state = invoice.place_of_supply
    if not buyer_state:
        raise HTTPException(status_code=400, detail="Buyer state must be configured for GST calculation.")

    if customer_id:
        customer = db.query(Customer).filter(
            Customer.customer_id == customer_id,
            Customer.tenant_id == current_user.tenant_id
        ).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        # Ensure customer state matches buyer_state if they are supposed to match, or just rely on place_of_supply


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
        
        print("CHECKOUT BRANCH:", invoice.branch_id)
        print("CHECKOUT VARIANT:", variant_id)
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

@router.get("/invoices/detailed")
def get_all_invoices_detailed(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.inventory import Product, ProductVariant
    invoices = db.query(Invoice).filter(
        Invoice.tenant_id == current_user.tenant_id
    ).order_by(Invoice.created_at.desc()).all()

    result = []
    for inv in invoices:
        items_data = []
        for item in inv.items:
            # Get product name via variant
            variant = db.query(ProductVariant).filter(ProductVariant.variant_id == item.variant_id).first()
            product_name = None
            if variant:
                product = db.query(Product).filter(Product.product_id == variant.product_id).first()
                product_name = product.name if product else None

            items_data.append({
                "invoice_item_id": item.invoice_item_id,
                "variant_id": item.variant_id,
                "product_name": product_name or item.variant_id,
                "quantity": float(item.quantity),
                "unit_price": float(item.unit_price),
                "discount_type": item.discount_type,
                "discount_value": float(item.discount_value),
                "discount_amount": float(item.discount_amount),
                "taxable_amount": float(item.taxable_amount),
                "gst_rate": float(item.gst_rate),
                "cgst_rate": float(item.cgst_rate),
                "sgst_rate": float(item.sgst_rate),
                "igst_rate": float(item.igst_rate),
                "cgst_amount": float(item.cgst_amount),
                "sgst_amount": float(item.sgst_amount),
                "igst_amount": float(item.igst_amount),
                "gst_amount": float(item.gst_amount),
                "subtotal": float(item.subtotal),
            })

        # Get customer name
        customer_name = None
        if inv.customer_id:
            customer = db.query(Customer).filter(Customer.customer_id == inv.customer_id).first()
            customer_name = customer.name if customer else None

        result.append({
            "invoice_id": inv.invoice_id,
            "invoice_number": inv.invoice_number,
            "created_at": inv.created_at.isoformat() if inv.created_at else None,
            "customer_id": inv.customer_id,
            "customer_name": customer_name,
            "total_amount": float(inv.total_amount),
            "outstanding_amount": float(inv.outstanding_amount),
            "total_tax": float(inv.total_tax),
            "total_cgst": float(inv.total_cgst),
            "total_sgst": float(inv.total_sgst),
            "total_igst": float(inv.total_igst),
            "total_discount": float(inv.total_discount),
            "tax_mode": inv.tax_mode,
            "is_tax_inclusive": inv.is_tax_inclusive,
            "place_of_supply": inv.place_of_supply,
            "round_off": float(inv.round_off) if inv.round_off else 0,
            "status": inv.status,
            "payment_mode": getattr(inv, 'payment_mode', 'CASH') or 'CASH',
            "items": items_data,
        })

    return result

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
            print("INVOICE ALREADY EXISTS:", invoice_data.invoice_number)
            continue
            
        customer = None
        seller_state = tenant.state or 'Tamil Nadu'
        buyer_state = invoice_data.place_of_supply
        if not buyer_state or buyer_state == 'Unknown':
            buyer_state = seller_state  # fallback to intrastate

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
                seller_state=seller_state,
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
            print("========== SALE ITEM ==========")
            print(item)

        totals = calculate_invoice_totals(processed_items)
        
        frontend_paid = invoice_data.total_amount - invoice_data.outstanding_amount
        if frontend_paid < 0: frontend_paid = 0
        frontend_paid_dec = Decimal(str(frontend_paid))
        
        outstanding_amount = totals["total_amount"] - frontend_paid_dec
        if outstanding_amount < Decimal("0.00"):
            outstanding_amount = Decimal("0.00")

        db_invoice = Invoice(
            tenant_id=current_user.tenant_id,
            branch_id=invoice_data.branch_id or "MAIN",
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
            payment_mode=invoice_data.payment_mode or "CASH",
            created_at=invoice_data.offline_created_at or datetime.datetime.utcnow(),
            **totals
        )
        db.add(db_invoice)
        db.flush()
        
        for variant_id, quantity, db_item in line_item_models:
            db_item.invoice_id = db_invoice.invoice_id
            db.add(db_item)
            
            # Inventory processing
            print("========== STOCK UPDATE ==========")
            print("BRANCH:", invoice_data.branch_id or "MAIN")
            print("VARIANT:", variant_id)
            print("QTY SOLD:", quantity)

            inv = db.query(Inventory).filter(
                Inventory.tenant_id == current_user.tenant_id,
                Inventory.branch_id == (invoice_data.branch_id or "MAIN"),
                Inventory.variant_id == variant_id
            ).first()

            print("INVENTORY FOUND:", inv)

            if not inv:
                print("NO INVENTORY ROW FOUND")

                inv = Inventory(
                    tenant_id=current_user.tenant_id,
                    branch_id=invoice_data.branch_id or "MAIN",
                    variant_id=variant_id,
                    quantity=0
                )
                db.add(inv)
                db.flush()

            expected_stock = inv.quantity

            print("BEFORE:", expected_stock)

            inv.quantity = int(inv.quantity) - int(quantity)

            actual_stock = inv.quantity

            print("AFTER:", actual_stock)
            
            try:
                adj = StockAdjustment(
                    tenant_id=current_user.tenant_id,
                    branch_id=invoice_data.branch_id or "MAIN",
                    variant_id=variant_id,
                    quantity_change=-int(quantity),
                    reason=f"Offline Sale Sync {invoice_data.invoice_number}"
                )
                db.add(adj)
            except Exception as e:
                print(f"StockAdjustment skipped: {e}")
            
            if actual_stock < 0:
                inv.quantity = 0  # clamp to 0, don't go negative
                try:
                    exc = InventoryException(
                        tenant_id=current_user.tenant_id,
                        branch_id=invoice_data.branch_id or "MAIN",
                        variant_id=variant_id,
                        expected_stock=expected_stock,
                        actual_stock=actual_stock,
                        difference=-int(quantity),
                        user_id=current_user.user_id,
                        status="Pending"
                    )
                    db.add(exc)
                    exceptions_count += 1
                except Exception as e:
                    print(f"InventoryException skipped: {e}")
                
                print(f"AUDIT: Stock for variant {variant_id} went negative ({actual_stock}) - invoice {invoice_data.invoice_number}")

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

        try:
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
        except Exception as journal_error:
            print(f"Journal posting skipped (accounting not set up): {journal_error}")

        synced_count += 1

    db.commit()
    return SyncResponse(status="success", synced_invoices=synced_count, exceptions_created=exceptions_count)