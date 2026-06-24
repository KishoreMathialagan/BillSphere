from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.customer import Customer
from app.models.sales import Invoice
from app.models.user import User
from app.schemas.customer import (
    CustomerCreate, CustomerUpdate, CustomerResponse,
    InvoiceCreate, InvoiceResponse, PaymentCreate
)
from app.api.dependencies import get_current_user
from app.services.tax_engine import validate_gstin

router = APIRouter()

@router.get("", response_model=List[CustomerResponse])
def get_customers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customers = db.query(Customer).filter(Customer.tenant_id == current_user.tenant_id).all()
    # Dynamically calculate outstanding balance from source transactions (Invoices)
    for c in customers:
        invoices = db.query(Invoice).filter(Invoice.customer_id == c.customer_id).all()
        c.outstanding_balance = sum(inv.outstanding_amount for inv in invoices)
    return customers

@router.post("", response_model=CustomerResponse)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if customer.gst_number and not validate_gstin(customer.gst_number):
        raise HTTPException(status_code=400, detail="Invalid GSTIN Format")
        
    db_customer = Customer(
        tenant_id=current_user.tenant_id,
        name=customer.name,
        phone=customer.phone,
        email=customer.email,
        gst_number=customer.gst_number,
        credit_limit=customer.credit_limit,
        outstanding_balance=customer.outstanding_balance
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = db.query(Customer).filter(
        Customer.customer_id == customer_id,
        Customer.tenant_id == current_user.tenant_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    invoices = db.query(Invoice).filter(Invoice.customer_id == customer.customer_id).all()
    customer.outstanding_balance = sum(inv.outstanding_amount for inv in invoices)
    
    return customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: str, customer_data: CustomerUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = db.query(Customer).filter(
        Customer.customer_id == customer_id,
        Customer.tenant_id == current_user.tenant_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    if customer_data.gst_number and not validate_gstin(customer_data.gst_number):
        raise HTTPException(status_code=400, detail="Invalid GSTIN Format")
    
    customer.name = customer_data.name
    customer.phone = customer_data.phone
    customer.email = customer_data.email
    customer.gst_number = customer_data.gst_number
    customer.credit_limit = customer_data.credit_limit
    
    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/{customer_id}")
def delete_customer(customer_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = db.query(Customer).filter(
        Customer.customer_id == customer_id,
        Customer.tenant_id == current_user.tenant_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(customer)
    db.commit()
    return {"detail": "Customer deleted successfully"}

@router.get("/{customer_id}/invoices", response_model=List[InvoiceResponse])
def get_customer_invoices(customer_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify customer exists and belongs to this tenant
    customer = db.query(Customer).filter(
        Customer.customer_id == customer_id,
        Customer.tenant_id == current_user.tenant_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    return db.query(Invoice).filter(
        Invoice.customer_id == customer_id,
        Invoice.tenant_id == current_user.tenant_id
    ).order_by(Invoice.created_at.desc()).all()

@router.post("/{customer_id}/invoices", response_model=InvoiceResponse)
def add_customer_invoice(customer_id: str, invoice: InvoiceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = db.query(Customer).filter(
        Customer.customer_id == customer_id,
        Customer.tenant_id == current_user.tenant_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Credit limit check:
    if invoice.outstanding_amount > 0:
        available_credit = customer.credit_limit - customer.outstanding_balance
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
        status=invoice.status
    )
    db.add(db_invoice)
    
    # Adjust outstanding balance
    customer.outstanding_balance += invoice.outstanding_amount
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

@router.post("/{customer_id}/payments", response_model=CustomerResponse)
def pay_outstanding_balance(customer_id: str, payment: PaymentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = db.query(Customer).filter(
        Customer.customer_id == customer_id,
        Customer.tenant_id == current_user.tenant_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Reduce outstanding balance (can be negative if they overpay, or capped at 0. Let's cap at 0 to avoid negative debt unless desired)
    customer.outstanding_balance = max(0.0, customer.outstanding_balance - payment.amount)
    
    # Record a virtual transaction for history representation
    db_invoice = Invoice(
        tenant_id=current_user.tenant_id,
        customer_id=customer_id,
        invoice_number=f"PAY-{int(datetime.datetime.utcnow().timestamp())}",
        total_amount=-payment.amount,
        outstanding_amount=-payment.amount,
        status="Paid"
    )
    db.add(db_invoice)
    db.flush()
    
    # Auto-Post Journal Entry
    from app.services.accounting import post_system_journal
    post_system_journal(
        db=db,
        tenant_id=current_user.tenant_id,
        entry_date=datetime.datetime.utcnow(),
        reference=db_invoice.invoice_number,
        description=f"Payment from Customer {customer.name}",
        source_entity="CustomerPayment",
        source_id=db_invoice.invoice_id,
        entries=[
            {"tag": "CASH", "debit": payment.amount},
            {"tag": "AR", "credit": payment.amount}
        ],
        user_id=current_user.user_id
    )
    
    db.commit()
    db.refresh(customer)
    return customer
import datetime
