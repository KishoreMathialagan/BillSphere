from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
import datetime

class CustomerBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = None
    credit_limit: Decimal = Decimal("0.00")
    outstanding_balance: Decimal = Decimal("0.00")

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = None
    credit_limit: Decimal = Decimal("0.00")

class CustomerResponse(CustomerBase):
    customer_id: str
    tenant_id: str
    class Config:
        from_attributes = True

class InvoiceItemCreate(BaseModel):
    variant_id: str
    quantity: Decimal
    unit_price: Decimal
    discount_type: str = "PERCENTAGE"
    discount_value: Decimal = Decimal("0.00")
    hsn_code: Optional[str] = None
    gst_rate: Decimal = Decimal("0.00")

class InvoiceItemResponse(BaseModel):
    invoice_item_id: str
    variant_id: str
    quantity: Decimal
    unit_price: Decimal
    discount_type: str
    discount_value: Decimal
    discount_amount: Decimal
    taxable_amount: Decimal
    hsn_code: Optional[str] = None
    gst_rate: Decimal
    cgst_rate: Decimal
    sgst_rate: Decimal
    igst_rate: Decimal
    tax_amount: Decimal
    gst_amount: Decimal
    cgst_amount: Decimal
    sgst_amount: Decimal
    igst_amount: Decimal
    subtotal: Decimal
    class Config:
        from_attributes = True

class InvoiceCreate(BaseModel):
    branch_id: Optional[str] = None
    invoice_number: str
    is_tax_inclusive: bool = False
    tax_mode: str = "EXCLUSIVE"
    status: str = "Paid"
    place_of_supply: Optional[str] = None
    eway_bill_number: Optional[str] = None
    transporter_name: Optional[str] = None
    vehicle_number: Optional[str] = None
    items: Optional[List[InvoiceItemCreate]] = []

class InvoiceResponse(BaseModel):
    invoice_id: str
    tenant_id: str
    branch_id: Optional[str] = None
    customer_id: Optional[str] = None
    invoice_number: str
    total_amount: Decimal
    outstanding_amount: Decimal
    total_tax: Decimal
    total_cgst: Decimal
    total_sgst: Decimal
    total_igst: Decimal
    total_discount: Decimal
    is_tax_inclusive: bool
    tax_mode: str
    round_off: Decimal
    tax_engine_version: str
    status: str
    created_at: datetime.datetime
    place_of_supply: Optional[str] = None
    eway_bill_number: Optional[str] = None
    transporter_name: Optional[str] = None
    vehicle_number: Optional[str] = None
    items: List[InvoiceItemResponse]
    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    amount: Decimal
    payment_method: str = "Cash"
