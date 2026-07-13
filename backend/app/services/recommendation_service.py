import datetime
from typing import List, Dict, Any

class RecommendationService:
    def __init__(self):
        # We can pass external AI client here if needed in the future
        pass

    def generate_recommendations(self, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        recs = []
        now = datetime.datetime.utcnow()
        rec_id = 1
        
        # 1. Inventory Recommendations
        inv = metrics.get("inventory", {})
        if inv.get("out_of_stock_count", 0) > 0:
            recs.append({
                "id": rec_id,
                "type": "INVENTORY ALERT",
                "priority": "CRITICAL",
                "title": f"{inv['out_of_stock_count']} Items Out of Stock",
                "description": f"You have {inv['out_of_stock_count']} items completely out of stock. Reorder immediately to prevent lost sales.",
                "navigation": {"route": "/app/inventory", "params": {}, "query": "?filter=out_of_stock"},
                "created_at": now
            })
            rec_id += 1
            
        elif inv.get("critical_stock_count", 0) > 0:
            recs.append({
                "id": rec_id,
                "type": "INVENTORY ALERT",
                "priority": "HIGH",
                "title": f"{inv['critical_stock_count']} Items at Critical Levels",
                "description": f"Stock is critically low for {inv['critical_stock_count']} items.",
                "navigation": {"route": "/app/inventory", "params": {}, "query": "?filter=critical_stock"},
                "created_at": now
            })
            rec_id += 1

        # 2. Trend Recommendations
        trends = metrics.get("trends", {})
        top_cat = trends.get("top_category")
        if top_cat and top_cat != "N/A":
            recs.append({
                "id": rec_id,
                "type": "TREND ANALYSIS",
                "priority": "INFO",
                "title": f"{top_cat} is trending",
                "description": f"{top_cat} is your top performing category for this period. Consider prioritizing its stock.",
                "navigation": {"route": "/app/reports", "params": {}, "query": "?tab=categories"},
                "created_at": now
            })
            rec_id += 1

        # 3. Health & Cash Flow Recommendations
        health = metrics.get("health", {})
        raw = metrics.get("raw", {})
        receivables = raw.get("receivables", 0)
        payables = raw.get("payables", 0)
        
        if health.get("status") in ["Warning", "Critical"]:
            recs.append({
                "id": rec_id,
                "type": "HEALTH ALERT",
                "priority": "HIGH",
                "title": "Business Health needs attention",
                "description": "Your overall business health score is dropping. Review your margins and inventory.",
                "navigation": {"route": "/app/reports", "params": {}, "query": "?tab=health"},
                "created_at": now
            })
            rec_id += 1
            
        if receivables > (payables * 1.5) and receivables > 0:
            recs.append({
                "id": rec_id,
                "type": "CASHFLOW ALERT",
                "priority": "MEDIUM",
                "title": "High Outstanding Receivables",
                "description": f"You have ₹{receivables:,.2f} pending from customers. Follow up to improve cash flow.",
                "navigation": {"route": "/app/customers", "params": {}, "query": "?filter=outstanding"},
                "created_at": now
            })
            rec_id += 1

        return recs
