from sqlalchemy import Column, String, ForeignKey, DateTime, Integer
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid
import datetime

class Branch(Base):
    __tablename__ = "branches"
    branch_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.tenant_id"))
    branch_name = Column(String, nullable=False)
    address = Column(String, nullable=True)

class InterBranchTransfer(Base):
    __tablename__ = "inter_branch_transfers"
    transfer_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.tenant_id"))
    from_branch_id = Column(String, ForeignKey("branches.branch_id"))
    to_branch_id = Column(String, ForeignKey("branches.branch_id"))
    status = Column(String, default="Pending") # Pending, In-Transit, Completed, Cancelled
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_by_user_id = Column(String, ForeignKey("users.user_id"))
    received_at = Column(DateTime, nullable=True)
    received_by_user_id = Column(String, ForeignKey("users.user_id"), nullable=True)

    items = relationship("TransferItem", back_populates="transfer")

class TransferItem(Base):
    __tablename__ = "transfer_items"
    item_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    transfer_id = Column(String, ForeignKey("inter_branch_transfers.transfer_id"))
    variant_id = Column(String, ForeignKey("product_variants.variant_id"))
    quantity = Column(Integer, nullable=False)

    transfer = relationship("InterBranchTransfer", back_populates="items")
