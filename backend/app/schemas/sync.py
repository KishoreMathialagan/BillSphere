from pydantic import BaseModel
from typing import List, Optional
import datetime
from app.schemas.customer import InvoiceCreate

class OfflineInvoiceSync(InvoiceCreate):
    offline_created_at: Optional[datetime.datetime] = None

class SyncPayload(BaseModel):
    invoices: List[OfflineInvoiceSync]

class SyncResponse(BaseModel):
    status: str
    synced_invoices: int
    exceptions_created: int
