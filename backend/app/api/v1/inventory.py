from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.inventory import Category, Product, ProductVariant, Inventory, StockAdjustment
from app.models.user import User
from app.schemas.inventory import (
    CategoryCreate, CategoryResponse, ProductCreate, ProductResponse, 
    StockAdjustmentCreate, InventoryResponse
)
from app.api.dependencies import get_current_user

router = APIRouter()

@router.post("/categories", response_model=CategoryResponse)
def create_category(category: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_category = Category(tenant_id=current_user.tenant_id, name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Category).filter(Category.tenant_id == current_user.tenant_id).all()

@router.post("/products", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_product = Product(
        tenant_id=current_user.tenant_id,
        category_id=product.category_id,
        name=product.name,
        hsn_code=product.hsn_code,
        tax_rate=product.tax_rate
    )
    db.add(db_product)
    db.flush()

    db_variants = []
    for var in product.variants:
        db_variant = ProductVariant(
            product_id=db_product.product_id,
            barcode=var.barcode,
            sku=var.sku,
            purchase_price=var.purchase_price,
            selling_price=var.selling_price
        )
        db.add(db_variant)
        db_variants.append(db_variant)
    
    db.commit()
    db.refresh(db_product)
    
    res = ProductResponse(
        product_id=db_product.product_id,
        name=db_product.name,
        category_id=db_product.category_id,
        hsn_code=db_product.hsn_code,
        tax_rate=db_product.tax_rate,
        variants=db_variants
    )
    return res

@router.get("/products", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    products = db.query(Product).filter(Product.tenant_id == current_user.tenant_id).all()
    results = []
    for p in products:
        variants = db.query(ProductVariant).filter(ProductVariant.product_id == p.product_id).all()
        results.append(ProductResponse(
            product_id=p.product_id, name=p.name, category_id=p.category_id,
            hsn_code=p.hsn_code, tax_rate=p.tax_rate, variants=variants
        ))
    return results

@router.post("/adjust", response_model=InventoryResponse)
def adjust_stock(adjustment: StockAdjustmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inv = db.query(Inventory).filter(
        Inventory.tenant_id == current_user.tenant_id,
        Inventory.branch_id == adjustment.branch_id,
        Inventory.variant_id == adjustment.variant_id
    ).first()

    if not inv:
        inv = Inventory(
            tenant_id=current_user.tenant_id,
            branch_id=adjustment.branch_id,
            variant_id=adjustment.variant_id,
            quantity=0
        )
        db.add(inv)
        db.flush()

    inv.quantity += adjustment.quantity_change
    
    adj_log = StockAdjustment(
        tenant_id=current_user.tenant_id,
        branch_id=adjustment.branch_id,
        variant_id=adjustment.variant_id,
        quantity_change=adjustment.quantity_change,
        reason=adjustment.reason
    )
    db.add(adj_log)
    db.commit()
    db.refresh(inv)
    return inv

@router.get("/alerts", response_model=List[InventoryResponse])
def get_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Inventory).filter(
        Inventory.tenant_id == current_user.tenant_id,
        Inventory.quantity <= Inventory.low_stock_threshold
    ).all()

from typing import Optional

@router.get("/stock", response_model=List[InventoryResponse])
def get_stock(branch_id: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Inventory).filter(Inventory.tenant_id == current_user.tenant_id)
    if branch_id:
        query = query.filter(Inventory.branch_id == branch_id)
    return query.all()
