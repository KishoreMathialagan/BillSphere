from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.db.session import get_db
from app.models.branch import Branch
from app.models.sales import Invoice
from app.models.inventory import Inventory, ProductVariant, InventoryException, Category, Product
from app.models.user import User
from app.models.accounting import JournalEntry, JournalLine, Account
from app.models.customer import Customer
from app.models.vendor import Vendor
from app.models.purchases import Purchase
from app.schemas.report import BranchReportResponse, BranchReportItem, DashboardMetricsResponse, TopItem
from app.services.dashboard_service import DashboardService
from app.api.dependencies import get_current_user
import datetime

router = APIRouter()

@router.get("/branches", response_model=BranchReportResponse)
def get_branch_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    branches = db.query(Branch).filter(Branch.tenant_id == current_user.tenant_id).all()
    
    report_items = []
    
    for branch in branches:
        # Total Sales
        total_sales = db.query(func.sum(Invoice.total_amount)).filter(
            Invoice.tenant_id == current_user.tenant_id,
            Invoice.branch_id == branch.branch_id,
            Invoice.status != "Cancelled"
        ).scalar() or 0.0

        # Inventory Value
        inventory_value = db.query(func.sum(Inventory.quantity * ProductVariant.purchase_price)).join(
            ProductVariant, Inventory.variant_id == ProductVariant.variant_id
        ).filter(
            Inventory.tenant_id == current_user.tenant_id,
            Inventory.branch_id == branch.branch_id
        ).scalar() or 0.0

        # Exceptions Count
        exception_count = db.query(func.count(InventoryException.exception_id)).filter(
            InventoryException.tenant_id == current_user.tenant_id,
            InventoryException.branch_id == branch.branch_id
        ).scalar() or 0

        report_items.append(BranchReportItem(
            branch_id=branch.branch_id,
            branch_name=branch.branch_name,
            total_sales=total_sales,
            inventory_value=inventory_value,
            exception_count=exception_count
        ))

    return BranchReportResponse(tenant_id=current_user.tenant_id, reports=report_items)

@router.get("/dashboard", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(
    filter: str = "this_month",
    branch_id: str = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    now = datetime.datetime.utcnow()
    
    if filter == "today":
        start_dt = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = now.replace(hour=23, minute=59, second=59)
    elif filter == "yesterday":
        start_dt = (now - datetime.timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = (now - datetime.timedelta(days=1)).replace(hour=23, minute=59, second=59)
    elif filter == "last_7_days":
        start_dt = (now - datetime.timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = now.replace(hour=23, minute=59, second=59)
    elif filter == "last_30_days":
        start_dt = (now - datetime.timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = now.replace(hour=23, minute=59, second=59)
    elif filter == "this_month":
        start_dt = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_dt = now.replace(hour=23, minute=59, second=59)
    elif filter == "this_year":
        start_dt = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end_dt = now.replace(hour=23, minute=59, second=59)
    else:
        # Default to this month
        start_dt = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_dt = now.replace(hour=23, minute=59, second=59)

    svc = DashboardService(db, current_user.tenant_id, branch_id)
    return svc.get_dashboard_metrics(start_dt, end_dt)
