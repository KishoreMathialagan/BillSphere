from sqlalchemy.orm import Session
from sqlalchemy import func
import datetime

from app.models.tenant import Tenant
from app.models.inventory import Inventory, ProductVariant, Product
from app.models.accounting import JournalEntry, JournalLine, Account
from app.services.llm_provider import get_llm_provider

def generate_business_context(db: Session, tenant_id: str) -> str:
    """
    Gathers key metrics from the database to inject into the LLM system prompt.
    """
    # 1. Financial Context (Last 30 days)
    end_dt = datetime.datetime.utcnow()
    start_dt = end_dt - datetime.timedelta(days=30)
    
    # Net Sales (Credit to SALES)
    sales_query = db.query(func.sum(JournalLine.credit) - func.sum(JournalLine.debit)).join(
        JournalEntry, JournalLine.journal_id == JournalEntry.journal_id
    ).join(
        Account, JournalLine.account_id == Account.account_id
    ).filter(
        JournalEntry.tenant_id == tenant_id,
        Account.system_tag == 'SALES',
        JournalEntry.entry_date >= start_dt,
        JournalEntry.entry_date <= end_dt
    )
    net_sales = sales_query.scalar() or 0.0

    # Net Purchases (Debit to INVENTORY from Purchase)
    purchases_query = db.query(func.sum(JournalLine.debit) - func.sum(JournalLine.credit)).join(
        JournalEntry, JournalLine.journal_id == JournalEntry.journal_id
    ).join(
        Account, JournalLine.account_id == Account.account_id
    ).filter(
        JournalEntry.tenant_id == tenant_id,
        Account.system_tag == 'INVENTORY',
        JournalEntry.source_entity == 'Purchase',
        JournalEntry.entry_date >= start_dt,
        JournalEntry.entry_date <= end_dt
    )
    net_purchases = purchases_query.scalar() or 0.0

    # 2. Inventory Context (Low Stock)
    low_stock_items = db.query(Product.name, Inventory.quantity, Inventory.low_stock_threshold).join(
        ProductVariant, Inventory.variant_id == ProductVariant.variant_id
    ).join(
        Product, ProductVariant.product_id == Product.product_id
    ).filter(
        Inventory.tenant_id == tenant_id,
        Inventory.quantity <= Inventory.low_stock_threshold
    ).limit(10).all()

    low_stock_text = "\n".join([f"- {item[0]}: {item[1]} in stock (Threshold: {item[2]})" for item in low_stock_items])
    if not low_stock_items:
        low_stock_text = "No items are currently low on stock."

    # Build prompt
    context = f"""
You are the AI Business Assistant for "Vendor Mind Retail OS". 
You provide intelligent insights, inventory suggestions, and profit advice based on real-time business data.

Here is the current context for this business:
- Total Net Sales (Last 30 Days): ${net_sales:.2f}
- Total Purchases (Last 30 Days): ${net_purchases:.2f}

Low Stock Alerts:
{low_stock_text}

Rules:
1. Use this data to answer the user's questions. 
2. If they ask for suggestions on profit, advise them based on reducing low-stock stockouts or analyzing the difference between sales and purchases.
3. Be professional, concise, and format your response using Markdown.
"""
    return context

def process_assistant_query(db: Session, tenant_id: str, query: str) -> str:
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        return "Error: Tenant not found."

    system_prompt = generate_business_context(db, tenant_id)
    
    provider = get_llm_provider()
    response = provider.generate_response(
        prompt=query, 
        system_prompt=system_prompt,
        model=tenant.ai_model
    )
    
    return response
