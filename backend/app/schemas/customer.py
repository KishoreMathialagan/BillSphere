from pydantic import BaseModel
from typing import Optional
import datetime

class CustomerBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = None
    credit_limit: float = 0.0
    outstanding_balance: float = 0.0

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = None
    credit_limit: float = 0.0

class CustomerResponse(CustomerBase):
    customer_id: str
    tenant_id: str
    class Config:
        from_attributes = True

class InvoiceItemCreate(BaseModel):
    variant_id: str
    quantity: float
    unit_price: float
    discount_amount: float = 0.0
    hsn_code: Optional[str] = None
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    cgst_amount: float = 0.0
    sgst_amount: float = 0.0
    igst_amount: float = 0.0
    subtotal: float

class InvoiceItemResponse(BaseModel):
    invoice_item_id: str
    variant_id: str
    quantity: float
    unit_price: float
    discount_amount: float
    hsn_code: Optional[str] = None
    tax_rate: float
    tax_amount: float
    cgst_amount: float
    sgst_amount: float
    igst_amount: float
    subtotal: float
    class Config:
        from_attributes = True

class InvoiceCreate(BaseModel):
    branch_id: Optional[str] = None
    invoice_number: str
    total_amount: float
    outstanding_amount: float = 0.0
    total_tax: float = 0.0
    total_cgst: float = 0.0
    total_sgst: float = 0.0
    total_igst: float = 0.0
    total_discount: float = 0.0
    status: str = "Paid"
    place_of_supply: Optional[str] = None
    eway_bill_number: Optional[str] = None
    transporter_name: Optional[str] = None
    vehicle_number: Optional[str] = None
    items: Optional[list[InvoiceItemCreate]] = []

class InvoiceResponse(BaseModel):
    invoice_id: str
    tenant_id: str
    branch_id: Optional[str] = None
    customer_id: Optional[str] = None
    invoice_number: str
    total_amount: float
    outstanding_amount: float
    total_tax: float
    total_cgst: float
    total_sgst: float
    total_igst: float
    total_discount: float
    status: str
    created_at: datetime.datetime
    place_of_supply: Optional[str] = None
    eway_bill_number: Optional[str] = None
    transporter_name: Optional[str] = None
    vehicle_number: Optional[str] = None
    items: list[InvoiceItemResponse]
    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    amount: float
    payment_method: str = "Cash"
