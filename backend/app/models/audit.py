from sqlalchemy import Column, String, DateTime
from app.db.session import Base
import uuid
import datetime

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    audit_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, nullable=False)
    user_id = Column(String, nullable=True)
    action = Column(String, nullable=False)
    entity = Column(String, nullable=False)
    details = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
