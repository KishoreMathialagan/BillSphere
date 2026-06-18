from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from app.db.session import Base
import uuid
import datetime
from sqlalchemy.orm import relationship

class Purchase(Base):
    __tablename__ = "purchases"
    
    purchase_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.tenant_id"))
    branch_id = Column(String, ForeignKey("branches.branch_id"), nullable=True)
    vendor_id = Column(String, ForeignKey("vendors.vendor_id"))
    purchase_number = Column(String, nullable=False)
    total_amount = Column(Float, default=0.0)
    outstanding_amount = Column(Float, default=0.0)
    total_tax = Column(Float, default=0.0)
    total_cgst = Column(Float, default=0.0)
    total_sgst = Column(Float, default=0.0)
    total_igst = Column(Float, default=0.0)
    status = Column(String, default="Paid")  # "Paid", "Unpaid", "Partially Paid"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    place_of_supply = Column(String, nullable=True)
    eway_bill_number = Column(String, nullable=True)
    transporter_name = Column(String, nullable=True)
    vehicle_number = Column(String, nullable=True)
    
    items = relationship("PurchaseItem", backref="purchase", cascade="all, delete-orphan")

class PurchaseItem(Base):
    __tablename__ = "purchase_items"
    
    purchase_item_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    purchase_id = Column(String, ForeignKey("purchases.purchase_id"))
    variant_id = Column(String, ForeignKey("product_variants.variant_id"))
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    hsn_code = Column(String, nullable=True)
    tax_rate = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    cgst_amount = Column(Float, default=0.0)
    sgst_amount = Column(Float, default=0.0)
    igst_amount = Column(Float, default=0.0)
    subtotal = Column(Float, default=0.0)
