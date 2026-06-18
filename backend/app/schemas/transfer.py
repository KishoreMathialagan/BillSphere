from pydantic import BaseModel
from typing import List, Optional
import datetime

class TransferItemCreate(BaseModel):
    variant_id: str
    quantity: int

class TransferCreate(BaseModel):
    from_branch_id: str
    to_branch_id: str
    items: List[TransferItemCreate]

class TransferItemResponse(BaseModel):
    item_id: str
    transfer_id: str
    variant_id: str
    quantity: int

    class Config:
        from_attributes = True

class TransferResponse(BaseModel):
    transfer_id: str
    tenant_id: str
    from_branch_id: str
    to_branch_id: str
    status: str
    created_at: datetime.datetime
    created_by_user_id: str
    received_at: Optional[datetime.datetime] = None
    received_by_user_id: Optional[str] = None
    items: List[TransferItemResponse]

    class Config:
        from_attributes = True
