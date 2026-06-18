from pydantic import BaseModel
from typing import Optional
import datetime

class VendorBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = None
    outstanding_balance: float = 0.0

class VendorCreate(VendorBase):
    pass

class VendorUpdate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = None

class VendorResponse(VendorBase):
    vendor_id: str
    tenant_id: str
    class Config:
        from_attributes = True

class PurchaseItemCreate(BaseModel):
    variant_id: str
    quantity: float
    unit_price: float
    hsn_code: Optional[str] = None
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    cgst_amount: float = 0.0
    sgst_amount: float = 0.0
    igst_amount: float = 0.0
    subtotal: float

class PurchaseItemResponse(BaseModel):
    purchase_item_id: str
    variant_id: str
    quantity: float
    unit_price: float
    hsn_code: Optional[str] = None
    tax_rate: float
    tax_amount: float
    cgst_amount: float
    sgst_amount: float
    igst_amount: float
    subtotal: float
    class Config:
        from_attributes = True

class PurchaseCreate(BaseModel):
    branch_id: Optional[str] = None
    purchase_number: str
    total_amount: float
    outstanding_amount: float = 0.0
    total_tax: float = 0.0
    total_cgst: float = 0.0
    total_sgst: float = 0.0
    total_igst: float = 0.0
    status: str = "Paid"
    place_of_supply: Optional[str] = None
    eway_bill_number: Optional[str] = None
    transporter_name: Optional[str] = None
    vehicle_number: Optional[str] = None
    items: Optional[list[PurchaseItemCreate]] = []

class PurchaseResponse(BaseModel):
    purchase_id: str
    tenant_id: str
    branch_id: Optional[str] = None
    vendor_id: Optional[str] = None
    purchase_number: str
    total_amount: float
    outstanding_amount: float
    total_tax: float
    total_cgst: float
    total_sgst: float
    total_igst: float
    status: str
    created_at: datetime.datetime
    place_of_supply: Optional[str] = None
    eway_bill_number: Optional[str] = None
    transporter_name: Optional[str] = None
    vehicle_number: Optional[str] = None
    items: list[PurchaseItemResponse]
    class Config:
        from_attributes = True

class VendorPaymentCreate(BaseModel):
    amount: float
    payment_method: str = "Cash"
