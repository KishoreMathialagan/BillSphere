from sqlalchemy import Column, String, Float, ForeignKey
from app.db.session import Base
import uuid

class Customer(Base):
    __tablename__ = "customers"
    
    customer_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.tenant_id"))
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    state = Column(String, nullable=True)
    gst_number = Column(String, nullable=True)
    credit_limit = Column(Float, default=0.0)
    outstanding_balance = Column(Float, default=0.0)
