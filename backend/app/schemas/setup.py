from pydantic import BaseModel, EmailStr

class SetupPayload(BaseModel):
    business_name: str
    gst_number: str | None = None
    legal_name: str | None = None
    state: str | None = None
    branch_name: str
    branch_address: str | None = None
    owner_email: EmailStr
    owner_password: str
