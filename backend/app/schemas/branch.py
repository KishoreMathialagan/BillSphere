from pydantic import BaseModel
from typing import Optional

class BranchCreate(BaseModel):
    branch_name: str
    address: Optional[str] = None

class BranchResponse(BaseModel):
    branch_id: str
    tenant_id: str
    branch_name: str
    address: Optional[str] = None

    class Config:
        orm_mode = True
