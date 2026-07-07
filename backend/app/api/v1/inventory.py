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
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_product = Product(
        tenant_id=current_user.tenant_id,
        category_id=product.category_id,
        name=product.name,
        hsn_code=product.hsn_code,
        tax_rate=product.tax_rate,
        main_unit=product.main_unit,              # ← NEW
        sub_unit=product.sub_unit,                # ← NEW
        conversion_factor=product.conversion_factor  # ← NEW
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
        db.flush()

        inventory = Inventory(
            tenant_id=current_user.tenant_id,
            branch_id="MAIN",
            variant_id=db_variant.variant_id,
            quantity=0
        )
        db.add(inventory)
        db_variants.append(db_variant)

    db.commit()
    db.refresh(db_product)

    return ProductResponse(
        product_id=db_product.product_id,
        name=db_product.name,
        category_id=db_product.category_id,
        hsn_code=db_product.hsn_code,
        tax_rate=db_product.tax_rate,
        main_unit=db_product.main_unit,              # ← NEW
        sub_unit=db_product.sub_unit,                # ← NEW
        conversion_factor=db_product.conversion_factor,  # ← NEW
        variants=db_variants
    )

@router.get("/products", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    products = db.query(Product).filter(Product.tenant_id == current_user.tenant_id).all()
    results = []
    for p in products:
        variants = db.query(ProductVariant).filter(ProductVariant.product_id == p.product_id).all()
        results.append(ProductResponse(
            product_id=p.product_id, name=p.name, category_id=p.category_id,
            hsn_code=p.hsn_code, tax_rate=p.tax_rate,
            main_unit=p.main_unit, sub_unit=p.sub_unit, conversion_factor=p.conversion_factor,
            variants=variants
        ))
    return results

@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.tenant_id == current_user.tenant_id, Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    variants = db.query(ProductVariant).filter(ProductVariant.product_id == product_id).all()
    return ProductResponse(
        product_id=product.product_id, name=product.name, category_id=product.category_id,
        hsn_code=product.hsn_code, tax_rate=product.tax_rate,
        main_unit=product.main_unit, sub_unit=product.sub_unit, conversion_factor=product.conversion_factor,
        variants=variants
    )

@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, product_data: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.tenant_id == current_user.tenant_id, Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.name = product_data.name
    product.category_id = product_data.category_id
    product.hsn_code = product_data.hsn_code
    product.tax_rate = product_data.tax_rate
    product.main_unit = product_data.main_unit              # ← NEW
    product.sub_unit = product_data.sub_unit                # ← NEW
    product.conversion_factor = product_data.conversion_factor  # ← NEW

    db.query(ProductVariant).filter(ProductVariant.product_id == product_id).delete()

    db_variants = []
    for var in product_data.variants:
        db_variant = ProductVariant(
            product_id=product_id,
            barcode=var.barcode,
            sku=var.sku,
            purchase_price=var.purchase_price,
            selling_price=var.selling_price
        )
        db.add(db_variant)
        db_variants.append(db_variant)

    db.commit()
    db.refresh(product)
    return ProductResponse(
        product_id=product.product_id, name=product.name, category_id=product.category_id,
        hsn_code=product.hsn_code, tax_rate=product.tax_rate,
        main_unit=product.main_unit, sub_unit=product.sub_unit, conversion_factor=product.conversion_factor,
        variants=db_variants
    )

@router.delete("/products/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.tenant_id == current_user.tenant_id, Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.query(ProductVariant).filter(ProductVariant.product_id == product_id).delete()
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}

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

@router.get("/stock/details")
def get_stock_details(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inventory_rows = (
        db.query(Inventory, ProductVariant, Product)
        .join(ProductVariant, Inventory.variant_id == ProductVariant.variant_id)
        .join(Product, ProductVariant.product_id == Product.product_id)
        .filter(Inventory.tenant_id == current_user.tenant_id)
        .all()
    )

    result = []
    for inv, variant, product in inventory_rows:
        result.append({
            "variant_id": variant.variant_id,
            "product_id": product.product_id,
            "product_name": product.name,
            "barcode": variant.barcode,
            "sku": variant.sku,
            "quantity": inv.quantity,
            "selling_price": variant.selling_price,
            "main_unit": product.main_unit,              # ← NEW
            "sub_unit": product.sub_unit,                # ← NEW
            "conversion_factor": product.conversion_factor  # ← NEW
        })

    return result