from pydantic import BaseModel
from typing import Optional

class TenantConfigResponse(BaseModel):
    tenant_id: str
    business_name: str
    gst_number: Optional[str] = None
    state: Optional[str] = None
    inventory_mode: str
    ai_model: str

class TenantConfigUpdate(BaseModel):
    business_name: Optional[str] = None
    gst_number: Optional[str] = None
    state: Optional[str] = None
    inventory_mode: Optional[str] = None
    ai_model: Optional[str] = None
