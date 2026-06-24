from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
import datetime

class VendorBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = None
    outstanding_balance: Decimal = Decimal("0.00")

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
    quantity: Decimal
    unit_price: Decimal
    discount_type: str = "PERCENTAGE"
    discount_value: Decimal = Decimal("0.00")
    hsn_code: Optional[str] = None
    gst_rate: Decimal = Decimal("0.00")

class PurchaseItemResponse(BaseModel):
    purchase_item_id: str
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

class PurchaseCreate(BaseModel):
    branch_id: Optional[str] = None
    purchase_number: str
    is_tax_inclusive: bool = False
    tax_mode: str = "EXCLUSIVE"
    status: str = "Paid"
    place_of_supply: Optional[str] = None
    eway_bill_number: Optional[str] = None
    transporter_name: Optional[str] = None
    vehicle_number: Optional[str] = None
    items: Optional[List[PurchaseItemCreate]] = []

class PurchaseResponse(BaseModel):
    purchase_id: str
    tenant_id: str
    branch_id: Optional[str] = None
    vendor_id: Optional[str] = None
    purchase_number: str
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
    items: List[PurchaseItemResponse]
    class Config:
        from_attributes = True

class VendorPaymentCreate(BaseModel):
    amount: Decimal
    payment_method: str = "Cash"
