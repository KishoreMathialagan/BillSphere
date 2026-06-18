from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None
    role: str | None = None
    tenant_id: str | None = None

class Login(BaseModel):
    email: EmailStr
    password: str
    
class RefreshRequest(BaseModel):
    refresh_token: str
