import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict

from app.models.accounting import JournalEntry, JournalLine, Account
from app.models.sales import InvoiceItem, Invoice
from app.models.inventory import Inventory, ProductVariant, Product

def get_sales_forecast(db: Session, tenant_id: str, history_days: int = 90, forecast_days: int = 30) -> Dict:
    """
    Returns historical daily sales and a projected moving-average forecast.
    """
    end_dt = datetime.datetime.utcnow()
    start_dt = end_dt - datetime.timedelta(days=history_days)
    
    # Get actual daily sales using ledger
    daily_sales_query = db.query(
        func.date(JournalEntry.entry_date).label('date'),
        func.sum(JournalLine.credit).label('sales')
    ).join(
        JournalLine, JournalLine.journal_id == JournalEntry.journal_id
    ).join(
        Account, JournalLine.account_id == Account.account_id
    ).filter(
        JournalEntry.tenant_id == tenant_id,
        Account.system_tag == 'SALES',
        JournalEntry.entry_date >= start_dt,
        JournalEntry.entry_date <= end_dt
    ).group_by(func.date(JournalEntry.entry_date)).order_by(func.date(JournalEntry.entry_date)).all()
    
    # Convert to list of dicts with gap filling
    sales_by_date = {str(row.date): float(row.sales) for row in daily_sales_query}
    
    historical = []
    total_sales_history = 0.0
    for i in range(history_days):
        dt = (start_dt + datetime.timedelta(days=i)).date()
        dt_str = str(dt)
        amount = sales_by_date.get(dt_str, 0.0)
        historical.append({"date": dt_str, "actual": amount})
        total_sales_history += amount
        
    # Moving Average (Simple Daily Average)
    avg_daily_sales = total_sales_history / history_days if history_days > 0 else 0.0
    
    forecast = []
    for i in range(1, forecast_days + 1):
        dt = (end_dt + datetime.timedelta(days=i)).date()
        forecast.append({"date": str(dt), "forecast": avg_daily_sales})
        
    return {
        "historical": historical,
        "forecast": forecast,
        "avg_daily_sales": avg_daily_sales
    }

def get_inventory_demand_forecast(db: Session, tenant_id: str, velocity_days: int = 30) -> List[Dict]:
    """
    Calculates average daily sales velocity per product and estimates days until stockout.
    """
    end_dt = datetime.datetime.utcnow()
    start_dt = end_dt - datetime.timedelta(days=velocity_days)
    
    # Calculate total units sold per variant in the last N days
    sold_query = db.query(
        InvoiceItem.variant_id,
        func.sum(InvoiceItem.quantity).label('total_sold')
    ).join(
        Invoice, InvoiceItem.invoice_id == Invoice.invoice_id
    ).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.created_at >= start_dt,
        Invoice.created_at <= end_dt
    ).group_by(InvoiceItem.variant_id).all()
    
    velocity_map = {row.variant_id: float(row.total_sold) / velocity_days for row in sold_query}
    
    # Get current inventory
    inventory_items = db.query(
        Inventory.variant_id,
        Inventory.quantity,
        Product.name,
        ProductVariant.sku
    ).join(
        ProductVariant, Inventory.variant_id == ProductVariant.variant_id
    ).join(
        Product, ProductVariant.product_id == Product.product_id
    ).filter(
        Inventory.tenant_id == tenant_id
    ).all()
    
    forecasts = []
    for inv in inventory_items:
        daily_velocity = velocity_map.get(inv.variant_id, 0.0)
        
        # If no sales history, days_remaining is 'Infinite' (-1)
        if daily_velocity > 0:
            days_remaining = int(inv.quantity / daily_velocity)
            projected_30d_demand = int(daily_velocity * 30)
        else:
            days_remaining = -1
            projected_30d_demand = 0
            
        forecasts.append({
            "variant_id": inv.variant_id,
            "product_name": inv.name,
            "sku": inv.sku,
            "current_stock": inv.quantity,
            "daily_velocity": round(daily_velocity, 2),
            "projected_30d_demand": projected_30d_demand,
            "days_remaining": days_remaining,
            "status": "Critical" if (days_remaining >= 0 and days_remaining <= 7) else 
                      "Warning" if (days_remaining > 7 and days_remaining <= 14) else 
                      "Healthy" if days_remaining > 14 else "Unknown"
        })
        
    # Sort by days_remaining (Critical first, ignore -1)
    def sort_key(x):
        if x['days_remaining'] == -1:
            return 999999
        return x['days_remaining']
        
    forecasts.sort(key=sort_key)
    
    return forecasts
