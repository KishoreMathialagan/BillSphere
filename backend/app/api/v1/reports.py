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
    start_date: str = None, 
    end_date: str = None, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Default to today if not provided
    if not start_date:
        start_date = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.datetime.utcnow().strftime("%Y-%m-%d")
        
    start_dt = datetime.datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = datetime.datetime.strptime(end_date, "%Y-%m-%d") + datetime.timedelta(days=1) - datetime.timedelta(microseconds=1)

    tenant_id = current_user.tenant_id

    # Function to get net balance for specific account tags
    def get_ledger_balance(tags, balance_type="credit", apply_date_filter=True):
        query = db.query(func.sum(JournalLine.credit - JournalLine.debit).label('net_credit')).join(
            JournalEntry, JournalLine.journal_id == JournalEntry.journal_id
        ).join(
            Account, JournalLine.account_id == Account.account_id
        ).filter(
            JournalEntry.tenant_id == tenant_id,
            Account.system_tag.in_(tags)
        )
        if apply_date_filter:
            query = query.filter(JournalEntry.entry_date >= start_dt, JournalEntry.entry_date <= end_dt)
            
        net_credit = query.scalar() or 0.0
        return float(net_credit) if balance_type == "credit" else float(-net_credit)

    # Total Sales = Net Debit to AR and CASH from Invoices in this period (Gross Sales)
    total_sales_query = db.query(func.sum(JournalLine.debit)).join(
        JournalEntry, JournalLine.journal_id == JournalEntry.journal_id
    ).join(
        Account, JournalLine.account_id == Account.account_id
    ).filter(
        JournalEntry.tenant_id == tenant_id,
        JournalEntry.source_entity == "Invoice",
        Account.system_tag.in_(['AR', 'CASH']),
        JournalEntry.entry_date >= start_dt,
        JournalEntry.entry_date <= end_dt
    )
    total_sales = total_sales_query.scalar() or 0.0
    # Total Purchases = Net Credit to AP from Purchases in this period (Gross Purchases)
    total_purchases_query = db.query(func.sum(JournalLine.credit)).join(
        JournalEntry, JournalLine.journal_id == JournalEntry.journal_id
    ).join(
        Account, JournalLine.account_id == Account.account_id
    ).filter(
        JournalEntry.tenant_id == tenant_id,
        JournalEntry.source_entity == "Purchase",
        Account.system_tag == 'AP',
        JournalEntry.entry_date >= start_dt,
        JournalEntry.entry_date <= end_dt
    )
    total_purchases = total_purchases_query.scalar() or 0.0

    # 2. GST Collected
    # Output GST is credit normal
    gst_collected = get_ledger_balance(['CGST_OUT', 'SGST_OUT', 'IGST_OUT'], balance_type="credit", apply_date_filter=True)

    # 3. Customer & Vendor Counts (Operational)
    customer_count = db.query(func.count(Customer.customer_id)).filter(
        Customer.tenant_id == tenant_id,
        Customer.created_at >= start_dt,
        Customer.created_at <= end_dt
    ).scalar() or 0

    vendor_count = db.query(func.count(Vendor.vendor_id)).filter(
        Vendor.tenant_id == tenant_id,
        Vendor.created_at >= start_dt,
        Vendor.created_at <= end_dt
    ).scalar() or 0

    # 4. Outstanding Receivables & Payables (All-time snapshots)
    # AR is debit normal
    outstanding_receivables = get_ledger_balance(['AR'], balance_type="debit", apply_date_filter=False)
    
    # AP is credit normal
    outstanding_payables = get_ledger_balance(['AP'], balance_type="credit", apply_date_filter=False)

    # 5. Inventory Value (All-time snapshot)
    # Inventory is debit normal
    inventory_value = get_ledger_balance(['INVENTORY'], balance_type="debit", apply_date_filter=False)

    # 6. Financial Profit Calculation (Revenue - COGS - Expenses + Other Income)
    # We aggregate journal lines within the date range by account type
    journal_lines = db.query(
        Account.account_type,
        func.sum(JournalLine.credit - JournalLine.debit).label('net_credit')
    ).join(
        JournalEntry, JournalLine.journal_id == JournalEntry.journal_id
    ).join(
        Account, JournalLine.account_id == Account.account_id
    ).filter(
        JournalEntry.tenant_id == tenant_id,
        JournalEntry.entry_date >= start_dt,
        JournalEntry.entry_date <= end_dt
    ).group_by(Account.account_type).all()

    total_revenue = 0.0
    total_expenses = 0.0
    
    for row in journal_lines:
        acc_type, net_credit = row
        # net_credit = Credit - Debit
        # Revenue normal balance is Credit (so net_credit is positive)
        # Expense/COGS normal balance is Debit (so net_credit is negative, taking abs or negating it)
        if acc_type == "Revenue":
            total_revenue += float(net_credit or 0)
        elif acc_type in ["Expense", "COGS"]:
            total_expenses += float(-net_credit or 0) # Convert debit to positive expense

    net_profit = total_revenue - total_expenses

    # 7. Top Products
    # Simplified: Get top 5 variants by sales volume in this period
    from app.models.sales import InvoiceItem
    top_products_query = db.query(
        Product.name,
        func.sum(InvoiceItem.quantity * InvoiceItem.unit_price).label('amount')
    ).join(
        Invoice, InvoiceItem.invoice_id == Invoice.invoice_id
    ).join(
        ProductVariant, InvoiceItem.variant_id == ProductVariant.variant_id
    ).join(
        Product, ProductVariant.product_id == Product.product_id
    ).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.created_at >= start_dt,
        Invoice.created_at <= end_dt,
        Invoice.status != "Cancelled"
    ).group_by(Product.name).order_by(func.sum(InvoiceItem.quantity * InvoiceItem.unit_price).desc()).limit(5).all()

    top_products = [TopItem(name=p.name, amount=float(p.amount)) for p in top_products_query]

    # 8. Top Categories
    top_categories_query = db.query(
        Category.name,
        func.sum(InvoiceItem.quantity * InvoiceItem.unit_price).label('amount')
    ).join(
        Invoice, InvoiceItem.invoice_id == Invoice.invoice_id
    ).join(
        ProductVariant, InvoiceItem.variant_id == ProductVariant.variant_id
    ).join(
        Product, ProductVariant.product_id == Product.product_id
    ).join(
        Category, Product.category_id == Category.category_id
    ).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.created_at >= start_dt,
        Invoice.created_at <= end_dt,
        Invoice.status != "Cancelled"
    ).group_by(Category.name).order_by(func.sum(InvoiceItem.quantity * InvoiceItem.unit_price).desc()).limit(5).all()

    top_categories = [TopItem(name=c.name, amount=float(c.amount)) for c in top_categories_query]

    return DashboardMetricsResponse(
        total_sales=total_sales,
        total_purchases=total_purchases,
        total_revenue=total_revenue,
        total_expenses=total_expenses,
        net_profit=net_profit,
        gst_collected=gst_collected,
        customer_count=customer_count,
        vendor_count=vendor_count,
        outstanding_receivables=outstanding_receivables,
        outstanding_payables=outstanding_payables,
        inventory_value=inventory_value,
        top_products=top_products,
        top_categories=top_categories
    )
