from sqlalchemy import Column, String, ForeignKey
from app.db.session import Base
import uuid

class User(Base):
    __tablename__ = "users"
    user_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.tenant_id"))
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    role = Column(String, default="Cashier")
