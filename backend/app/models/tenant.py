from sqlalchemy import Column, String, DateTime
from app.db.session import Base
import uuid
import datetime

class Tenant(Base):
    __tablename__ = "tenants"
    tenant_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    business_name = Column(String, nullable=False)
    gst_number = Column(String, nullable=True)
    legal_name = Column(String, nullable=True)
    state = Column(String, nullable=True) # e.g. "Maharashtra"
    inventory_mode = Column(String, default="Strict") # "Strict" or "Flexible"
    financial_year_start = Column(DateTime, nullable=True) # E.g. April 1st of current year
    ai_model = Column(String, default="qwen/qwen-2.5-7b-instruct") # OpenRouter model ID
