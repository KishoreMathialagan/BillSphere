from pydantic import BaseModel
from typing import List, Optional
import datetime
from decimal import Decimal
from app.schemas.customer import InvoiceCreate, InvoiceItemCreate

class OfflineInvoiceSync(InvoiceCreate):
    offline_created_at: Optional[datetime.datetime] = None
    customer_id: Optional[str] = None
    total_amount: Decimal = Decimal("0.00")
    outstanding_amount: Decimal = Decimal("0.00")
    total_tax: Decimal = Decimal("0.00")
    total_cgst: Decimal = Decimal("0.00")
    total_sgst: Decimal = Decimal("0.00")
    total_igst: Decimal = Decimal("0.00")
    total_discount: Decimal = Decimal("0.00")

class SyncPayload(BaseModel):
    invoices: List[OfflineInvoiceSync]

class SyncResponse(BaseModel):
    status: str
    synced_invoices: int
    exceptions_created: int