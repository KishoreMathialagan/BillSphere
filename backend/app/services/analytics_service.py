import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.repositories.analytics_repository import AnalyticsRepository

class AnalyticsService:
    def __init__(self, db: Session, tenant_id: str, branch_id: Optional[str] = None):
        self.repo = AnalyticsRepository(db, tenant_id, branch_id)

    def calculate_health_score(self, profit_margin: float, low_stock: int, out_of_stock: int, receivables: float, payables: float, invoice_count: int) -> Dict[str, Any]:
        """Calculates a weighted business health score (0-100)"""
        # Profitability (30 points max)
        profit_score = 30
        if profit_margin < 0:
            profit_score = 0
        elif profit_margin < 10:
            profit_score = 10
        elif profit_margin < 20:
            profit_score = 20

        # Inventory Health (20 points max)
        inventory_score = 20 - (out_of_stock * 2) - (low_stock * 0.5)
        inventory_score = max(0, inventory_score)

        # Cash Flow / Receivables (25 points max)
        cash_score = 25
        if receivables > (payables * 1.5): # Too many outstanding receivables
            cash_score -= 10
        if payables > (receivables * 1.5): # Cash flow strain on payables
            cash_score -= 5
            
        # Sales Activity (25 points max)
        activity_score = 10 if invoice_count < 10 else (20 if invoice_count < 50 else 25)

        total_score = int(profit_score + inventory_score + cash_score + activity_score)
        total_score = max(0, min(100, total_score))
        
        status = "Excellent" if total_score >= 85 else ("Good" if total_score >= 70 else ("Warning" if total_score >= 50 else "Critical"))

        return {
            "score": total_score,
            "status": status,
            "components": {
                "profitability": profit_score,
                "inventory": inventory_score,
                "cashflow": cash_score,
                "activity": activity_score
            }
        }

    def get_dashboard_metrics(self, start_dt: datetime.datetime, end_dt: datetime.datetime) -> Dict[str, Any]:
        duration = (end_dt - start_dt).days + 1
        prev_start_dt = start_dt - datetime.timedelta(days=duration)
        prev_end_dt = start_dt - datetime.timedelta(seconds=1)

        # Revenue & Profit
        curr_rev, curr_exp, curr_prof = self.repo.get_total_sales_and_profit(start_dt, end_dt)
        prev_rev, prev_exp, prev_prof = self.repo.get_total_sales_and_profit(prev_start_dt, prev_end_dt)
        
        growth = ((curr_rev - prev_rev) / prev_rev * 100) if prev_rev > 0 else (100 if curr_rev > 0 else 0)
        trend = "up" if curr_rev > prev_rev else ("down" if curr_rev < prev_rev else "neutral")

        # Invoices
        inv_metrics = self.repo.get_invoice_metrics(start_dt, end_dt)
        
        # Inventory
        inv_status = self.repo.get_inventory_status()

        # Receivables & Payables
        receivables = self.repo.get_ledger_balance(['AR'], balance_type="debit")
        payables = self.repo.get_ledger_balance(['AP'], balance_type="credit")

        # Health
        profit_margin = (curr_prof / curr_rev * 100) if curr_rev > 0 else 0
        health = self.calculate_health_score(
            profit_margin=profit_margin,
            low_stock=inv_status["low_stock_count"],
            out_of_stock=inv_status["out_of_stock_count"],
            receivables=receivables,
            payables=payables,
            invoice_count=inv_metrics["count"]
        )

        # Trends
        daily_sales = self.repo.get_daily_sales(start_dt, end_dt)
        top_entities = self.repo.get_top_entities(start_dt, end_dt)
        
        now = datetime.datetime.utcnow()

        return {
            "revenue": {
                "current_revenue": {"value": curr_rev, "change": growth, "trend": trend, "last_updated": now},
                "previous_revenue": {"value": prev_rev, "change": 0, "trend": "neutral", "last_updated": now}
            },
            "invoices": {
                "count": {"value": inv_metrics["count"], "change": 0, "trend": "neutral", "last_updated": now},
                "average_amount": {"value": inv_metrics["average_amount"], "change": 0, "trend": "neutral", "last_updated": now},
                "highest_amount": inv_metrics["highest_amount"],
                "lowest_amount": inv_metrics["lowest_amount"]
            },
            "inventory": {
                "low_stock_count": inv_status["low_stock_count"],
                "critical_stock_count": inv_status["critical_stock_count"],
                "out_of_stock_count": inv_status["out_of_stock_count"]
            },
            "health": health,
            "trends": {
                "sales_series": {
                    "interval": "day",
                    "start_date": start_dt.isoformat(),
                    "end_date": end_dt.isoformat(),
                    "points": daily_sales
                },
                "top_product": top_entities["top_product"]["name"] if top_entities["top_product"]["name"] else "N/A",
                "top_category": top_entities["top_category"]["name"] if top_entities["top_category"]["name"] else "N/A",
                "fastest_growing_product": "N/A", # Placeholder for future scaling
                "highest_profit_product": "N/A",  # Placeholder for future scaling
                "slow_moving_product": "N/A"      # Placeholder for future scaling
            },
            # Passes required raw info to recommendation service
            "raw": {
                "receivables": receivables,
                "payables": payables,
                "profit_margin": profit_margin
            }
        }
