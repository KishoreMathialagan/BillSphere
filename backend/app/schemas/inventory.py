from pydantic import BaseModel
from typing import List, Optional

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    category_id: str
    class Config:
        from_attributes = True

class VariantBase(BaseModel):
    barcode: Optional[str] = None
    sku: Optional[str] = None
    purchase_price: float
    selling_price: float

class VariantCreate(VariantBase):
    pass

class VariantResponse(VariantBase):
    variant_id: str
    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    name: str
    category_id: Optional[str] = None
    hsn_code: Optional[str] = None
    tax_rate: float = 0.0
    variants: List[VariantCreate]

class ProductResponse(BaseModel):
    product_id: str
    name: str
    category_id: Optional[str]
    hsn_code: Optional[str]
    tax_rate: float
    variants: List[VariantResponse] = []
    class Config:
        from_attributes = True

class StockAdjustmentCreate(BaseModel):
    branch_id: str
    variant_id: str
    quantity_change: int
    reason: Optional[str] = None

class InventoryResponse(BaseModel):
    inventory_id: str
    branch_id: str
    variant_id: str
    quantity: int
    low_stock_threshold: int
    class Config:
        from_attributes = True
