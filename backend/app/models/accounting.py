from sqlalchemy import Column, String, ForeignKey, DateTime, Float, Boolean, Integer
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid
import datetime

class Account(Base):
    __tablename__ = "accounts"
    account_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.tenant_id"))
    account_name = Column(String, nullable=False)
    account_code = Column(String, nullable=False)
    account_type = Column(String, nullable=False) # Asset, Liability, Equity, Revenue, Expense
    description = Column(String, nullable=True)
    is_system_account = Column(Boolean, default=False)
    system_tag = Column(String, nullable=True) # e.g., "CASH", "AR", "AP", "SALES", "GST_OUT", "GST_IN"

    journal_lines = relationship("JournalLine", back_populates="account")

class JournalEntry(Base):
    __tablename__ = "journal_entries"
    journal_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.tenant_id"))
    entry_date = Column(DateTime, default=datetime.datetime.utcnow)
    reference = Column(String, nullable=True) # Invoice #, Bill #, etc.
    description = Column(String, nullable=True)
    source_entity = Column(String, nullable=True) # "Invoice", "Purchase", "Manual"
    source_id = Column(String, nullable=True)
    created_by_user_id = Column(String, ForeignKey("users.user_id"), nullable=True)

    lines = relationship("JournalLine", back_populates="journal")

class JournalLine(Base):
    __tablename__ = "journal_lines"
    line_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    journal_id = Column(String, ForeignKey("journal_entries.journal_id"))
    account_id = Column(String, ForeignKey("accounts.account_id"))
    debit = Column(Float, default=0.0)
    credit = Column(Float, default=0.0)

    journal = relationship("JournalEntry", back_populates="lines")
    account = relationship("Account", back_populates="journal_lines")
