import sys
import os
sys.path.append(os.getcwd())
from app.db.session import engine, Base
from app.models import tenant, user, branch, inventory, customer, sales, vendor, purchases
Base.metadata.create_all(bind=engine)

from app.db.session import SessionLocal
from app.models.tenant import Tenant
from app.models.branch import Branch
from app.models.user import User
from app.models.customer import Customer
from app.models.sales import Invoice
from app.models.vendor import Vendor
from app.models.purchases import Purchase
from app.core.security import get_password_hash

db = SessionLocal()
try:
    tenant = Tenant(business_name="Demo Business")
    db.add(tenant)
    db.flush()

    branch = Branch(tenant_id=tenant.tenant_id, branch_name="Demo Branch")
    db.add(branch)
    db.flush()

    user = User(tenant_id=tenant.tenant_id, email="demo@billsphere.com", password_hash=get_password_hash("password123"), role="Owner")
    db.add(user)
    db.flush()

    demo_customer = Customer(
        tenant_id=tenant.tenant_id,
        name="Acme Corporation",
        phone="9876543210",
        email="info@acme.com",
        credit_limit=2000.0,
        outstanding_balance=450.0
    )
    db.add(demo_customer)
    db.flush()

    demo_invoice = Invoice(
        tenant_id=tenant.tenant_id,
        branch_id=branch.branch_id,
        customer_id=demo_customer.customer_id,
        invoice_number="INV-2026-0001",
        total_amount=1000.0,
        outstanding_amount=450.0,
        status="Partially Paid"
    )
    db.add(demo_invoice)
    db.flush()

    demo_vendor = Vendor(
        tenant_id=tenant.tenant_id,
        name="Supreme Suppliers",
        phone="0123456789",
        email="sales@supreme.com",
        gst_number="27BBBBB2222B2Z2",
        outstanding_balance=600.0
    )
    db.add(demo_vendor)
    db.flush()

    demo_purchase = Purchase(
        tenant_id=tenant.tenant_id,
        branch_id=branch.branch_id,
        vendor_id=demo_vendor.vendor_id,
        purchase_number="PUR-2026-0001",
        total_amount=1200.0,
        outstanding_amount=600.0,
        status="Partially Paid"
    )
    db.add(demo_purchase)

    db.commit()
    print("Demo user, customer, invoice, vendor, and purchase created successfully.")
except Exception as e:
    db.rollback()
    print("Error:", e)
