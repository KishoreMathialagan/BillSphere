from sqlalchemy import Column, String, Numeric, Enum, Boolean, ForeignKey, DateTime
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
    total_amount = Column(Numeric(18,2), default=0.0)
    outstanding_amount = Column(Numeric(18,2), default=0.0)
    total_tax = Column(Numeric(18,2), default=0.0)
    total_cgst = Column(Numeric(18,2), default=0.0)
    total_sgst = Column(Numeric(18,2), default=0.0)
    total_igst = Column(Numeric(18,2), default=0.0)
    total_discount = Column(Numeric(18,2), default=0.0)
    is_tax_inclusive = Column(Boolean, default=False)
    tax_mode = Column(Enum("INCLUSIVE", "EXCLUSIVE", name="tax_mode_enum"), default="EXCLUSIVE")
    round_off = Column(Numeric(18,2), default=0.0)
    tax_engine_version = Column(String, default="v1.0")
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
    quantity = Column(Numeric(18,4), default=1.0)
    unit_price = Column(Numeric(18,2), default=0.0)
    discount_type = Column(Enum("PERCENTAGE", "FIXED", name="discount_type_enum"), default="PERCENTAGE")
    discount_value = Column(Numeric(18,2), default=0.0)
    discount_amount = Column(Numeric(18,2), default=0.0)
    taxable_amount = Column(Numeric(18,2), default=0.0)
    hsn_code = Column(String, nullable=True)
    gst_rate = Column(Numeric(5,2), default=0.0)
    cgst_rate = Column(Numeric(5,2), default=0.0)
    sgst_rate = Column(Numeric(5,2), default=0.0)
    igst_rate = Column(Numeric(5,2), default=0.0)
    tax_amount = Column(Numeric(18,2), default=0.0) # Used for backward compatibility or total tax per line
    gst_amount = Column(Numeric(18,2), default=0.0)
    cgst_amount = Column(Numeric(18,2), default=0.0)
    sgst_amount = Column(Numeric(18,2), default=0.0)
    igst_amount = Column(Numeric(18,2), default=0.0)
    subtotal = Column(Numeric(18,2), default=0.0)
