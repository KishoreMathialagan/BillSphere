from sqlalchemy import Column, String, Numeric, Integer, ForeignKey, DateTime
from app.db.session import Base
import uuid
import datetime

class Category(Base):
    __tablename__ = "categories"
    category_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.tenant_id"))
    name = Column(String, nullable=False)

class Product(Base):
    __tablename__ = "products"
    product_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.tenant_id"))
    category_id = Column(String, ForeignKey("categories.category_id"), nullable=True)
    name = Column(String, nullable=False)
    hsn_code = Column(String, nullable=True)
    tax_rate = Column(Numeric(5,2), default=0.0)

class ProductVariant(Base):
    __tablename__ = "product_variants"
    variant_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String, ForeignKey("products.product_id"))
    barcode = Column(String, nullable=True, index=True)
    sku = Column(String, nullable=True)
    purchase_price = Column(Numeric(18,2), default=0.0)
    selling_price = Column(Numeric(18,2), default=0.0)

class Inventory(Base):
    __tablename__ = "inventory"
    inventory_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.tenant_id"))
    branch_id = Column(String, ForeignKey("branches.branch_id"))
    variant_id = Column(String, ForeignKey("product_variants.variant_id"))
    quantity = Column(Integer, default=0)
    low_stock_threshold = Column(Integer, default=10)

class StockAdjustment(Base):
    __tablename__ = "stock_adjustments"
    adjustment_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.tenant_id"))
    branch_id = Column(String, ForeignKey("branches.branch_id"))
    variant_id = Column(String, ForeignKey("product_variants.variant_id"))
    quantity_change = Column(Integer, nullable=False)
    reason = Column(String, nullable=True)

class InventoryException(Base):
    __tablename__ = "inventory_exceptions"
    exception_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.tenant_id"))
    branch_id = Column(String, ForeignKey("branches.branch_id"))
    variant_id = Column(String, ForeignKey("product_variants.variant_id"))
    expected_stock = Column(Integer, nullable=False)
    actual_stock = Column(Integer, nullable=False)
    difference = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(String, nullable=True)
    status = Column(String, default="Pending") # "Pending", "Resolved"
