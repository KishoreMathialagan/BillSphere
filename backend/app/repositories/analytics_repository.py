import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Tuple, Dict, Any, Optional

from app.models.accounting import JournalEntry, JournalLine, Account
from app.models.sales import Invoice, InvoiceItem
from app.models.purchases import Purchase
from app.models.inventory import Inventory, ProductVariant, Product, Category
from app.models.customer import Customer
from app.models.vendor import Vendor

class AnalyticsRepository:
    def __init__(self, db: Session, tenant_id: str, branch_id: Optional[str] = None):
        self.db = db
        self.tenant_id = tenant_id
        self.branch_id = branch_id

    def get_ledger_balance(self, tags: List[str], balance_type: str = "credit", start_dt: Optional[datetime.datetime] = None, end_dt: Optional[datetime.datetime] = None) -> float:
        query = self.db.query(func.sum(JournalLine.credit - JournalLine.debit).label('net_credit')).join(
            JournalEntry, JournalLine.journal_id == JournalEntry.journal_id
        ).join(
            Account, JournalLine.account_id == Account.account_id
        ).filter(
            JournalEntry.tenant_id == self.tenant_id,
            Account.system_tag.in_(tags)
        )
        if start_dt and end_dt:
            query = query.filter(JournalEntry.entry_date >= start_dt, JournalEntry.entry_date <= end_dt)
        if self.branch_id:
            query = query.filter(JournalEntry.branch_id == self.branch_id)
            
        net_credit = query.scalar() or 0.0
        return float(net_credit) if balance_type == "credit" else float(-net_credit)

    def get_total_sales_and_profit(self, start_dt: datetime.datetime, end_dt: datetime.datetime) -> Tuple[float, float, float]:
        """Returns total revenue, total expenses/COGS, and net profit"""
        query = self.db.query(
            Account.account_type,
            func.sum(JournalLine.credit - JournalLine.debit).label('net_credit')
        ).join(
            JournalEntry, JournalLine.journal_id == JournalEntry.journal_id
        ).join(
            Account, JournalLine.account_id == Account.account_id
        ).filter(
            JournalEntry.tenant_id == self.tenant_id,
            JournalEntry.entry_date >= start_dt,
            JournalEntry.entry_date <= end_dt
        )
        if self.branch_id:
            query = query.filter(JournalEntry.branch_id == self.branch_id)
            
        journal_lines = query.group_by(Account.account_type).all()
        
        total_revenue = 0.0
        total_expenses = 0.0
        for acc_type, net_credit in journal_lines:
            if acc_type == "Revenue":
                total_revenue += float(net_credit or 0)
            elif acc_type in ["Expense", "COGS"]:
                total_expenses += float(-net_credit or 0)
                
        net_profit = total_revenue - total_expenses
        return total_revenue, total_expenses, net_profit

    def get_invoice_metrics(self, start_dt: datetime.datetime, end_dt: datetime.datetime) -> Dict[str, Any]:
        query = self.db.query(
            func.count(Invoice.invoice_id).label('count'),
            func.avg(Invoice.total_amount).label('avg'),
            func.max(Invoice.total_amount).label('max'),
            func.min(Invoice.total_amount).label('min')
        ).filter(
            Invoice.tenant_id == self.tenant_id,
            Invoice.created_at >= start_dt,
            Invoice.created_at <= end_dt,
            Invoice.status != "Cancelled"
        )
        if self.branch_id:
            query = query.filter(Invoice.branch_id == self.branch_id)
            
        res = query.first()
        return {
            "count": int(res.count or 0),
            "average_amount": float(res.avg or 0.0),
            "highest_amount": float(res.max or 0.0),
            "lowest_amount": float(res.min or 0.0)
        }

    def get_inventory_status(self) -> Dict[str, int]:
        query = self.db.query(
            Inventory.quantity,
            Inventory.low_stock_threshold
        ).filter(
            Inventory.tenant_id == self.tenant_id
        )
        if self.branch_id:
            query = query.filter(Inventory.branch_id == self.branch_id)
            
        items = query.all()
        low = 0
        critical = 0
        out = 0
        
        for q, t in items:
            if q <= 0:
                out += 1
            elif q <= (t / 2): # Critical if less than half of low_stock_threshold
                critical += 1
            elif q <= t:
                low += 1
                
        return {
            "low_stock_count": low,
            "critical_stock_count": critical,
            "out_of_stock_count": out
        }

    def get_daily_sales(self, start_dt: datetime.datetime, end_dt: datetime.datetime) -> List[Dict[str, Any]]:
        query = self.db.query(
            func.date(JournalEntry.entry_date).label('date'),
            func.sum(JournalLine.credit).label('sales')
        ).join(
            JournalLine, JournalLine.journal_id == JournalEntry.journal_id
        ).join(
            Account, JournalLine.account_id == Account.account_id
        ).filter(
            JournalEntry.tenant_id == self.tenant_id,
            Account.system_tag == 'SALES',
            JournalEntry.entry_date >= start_dt,
            JournalEntry.entry_date <= end_dt
        )
        if self.branch_id:
            query = query.filter(JournalEntry.branch_id == self.branch_id)
            
        daily = query.group_by(func.date(JournalEntry.entry_date)).order_by(func.date(JournalEntry.entry_date)).all()
        
        return [{"date": str(d.date), "sales": float(d.sales)} for d in daily]

    def get_top_entities(self, start_dt: datetime.datetime, end_dt: datetime.datetime) -> Dict[str, Any]:
        # Top Product
        top_prod_query = self.db.query(
            Product.name,
            func.sum(InvoiceItem.quantity * InvoiceItem.unit_price).label('amount')
        ).join(
            Invoice, InvoiceItem.invoice_id == Invoice.invoice_id
        ).join(
            ProductVariant, InvoiceItem.variant_id == ProductVariant.variant_id
        ).join(
            Product, ProductVariant.product_id == Product.product_id
        ).filter(
            Invoice.tenant_id == self.tenant_id,
            Invoice.created_at >= start_dt,
            Invoice.created_at <= end_dt,
            Invoice.status != "Cancelled"
        )
        if self.branch_id:
            top_prod_query = top_prod_query.filter(Invoice.branch_id == self.branch_id)
            
        top_product = top_prod_query.group_by(Product.name).order_by(func.sum(InvoiceItem.quantity * InvoiceItem.unit_price).desc()).first()

        # Top Category
        top_cat_query = self.db.query(
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
            Invoice.tenant_id == self.tenant_id,
            Invoice.created_at >= start_dt,
            Invoice.created_at <= end_dt,
            Invoice.status != "Cancelled"
        )
        if self.branch_id:
            top_cat_query = top_cat_query.filter(Invoice.branch_id == self.branch_id)
            
        top_category = top_cat_query.group_by(Category.name).order_by(func.sum(InvoiceItem.quantity * InvoiceItem.unit_price).desc()).first()
        
        return {
            "top_product": {"name": top_product.name if top_product else None, "amount": float(top_product.amount) if top_product else 0.0},
            "top_category": {"name": top_category.name if top_category else None, "amount": float(top_category.amount) if top_category else 0.0}
        }
