from pydantic import BaseModel
from typing import List, Optional
import datetime

class AccountCreate(BaseModel):
    account_name: str
    account_code: str
    account_type: str
    description: Optional[str] = None
    is_system_account: bool = False
    system_tag: Optional[str] = None

class AccountResponse(AccountCreate):
    account_id: str
    tenant_id: str

    class Config:
        orm_mode = True

class JournalLineCreate(BaseModel):
    account_id: str
    debit: float
    credit: float

class JournalEntryCreate(BaseModel):
    entry_date: datetime.datetime
    reference: Optional[str] = None
    description: Optional[str] = None
    lines: List[JournalLineCreate]

class JournalLineResponse(JournalLineCreate):
    line_id: str
    journal_id: str

    class Config:
        orm_mode = True

class JournalEntryResponse(BaseModel):
    journal_id: str
    tenant_id: str
    entry_date: datetime.datetime
    reference: Optional[str] = None
    description: Optional[str] = None
    source_entity: Optional[str] = None
    source_id: Optional[str] = None
    created_by_user_id: Optional[str] = None
    lines: List[JournalLineResponse]

    class Config:
        orm_mode = True
