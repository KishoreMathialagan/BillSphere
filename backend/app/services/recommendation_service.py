import datetime
from typing import List, Dict, Any

# ── INDIAN SUPERMARKET SEASONAL CALENDAR ──
# month: (season_name, products_to_stock, reason)
INDIAN_SEASONAL_CALENDAR = {
    1:  ("Winter",  ["Dry Fruits", "Nuts", "Root Vegetables", "Carrots", "Radish", "Warm Beverages", "Gur / Jaggery", "Til / Sesame"],
                    "Winter demand is high for warm foods and dry fruits. Pongal festival season — stock up on rice, jaggery, sesame."),
    2:  ("Winter/Spring", ["Strawberries", "Peas", "Cauliflower", "Cabbage", "Chocolate", "Roses", "Gift Packs"],
                    "Valentine's season boosts gift packs and fresh fruits. Spring harvest vegetables are at peak."),
    3:  ("Summer Start", ["Mangoes", "Watermelon", "Buttermilk", "Coconut Water", "Cold Drinks", "Ice Cream", "Colours/Gulal"],
                    "Holi festival — stock colours, sweets, and snacks. Summer beginning — cold beverages and fruits in demand."),
    4:  ("Summer", ["Mangoes", "Ice Cream", "Cold Drinks", "Lemon", "Mint", "Curd / Yoghurt", "ORS Packets", "Tender Coconut"],
                    "Peak summer — highest demand for cooling products. Mango season begins. Tamil New Year / Vishu — stock up on fruits and sweets."),
    5:  ("Peak Summer", ["Mangoes", "Watermelon", "Ice Cream", "Fruit Juices", "Cold Drinks", "Coconut Water", "Sugarcane Juice"],
                    "Hottest month — maximise cold beverages and ice cream stock. Mango varieties at peak — keep well stocked."),
    6:  ("Monsoon Start", ["Umbrellas", "Corn / Bhutta", "Hot Snacks", "Tea", "Coffee", "Ginger", "Turmeric", "Immunity Boosters"],
                    "Monsoon begins — hot snacks and beverages surge. Ginger, turmeric, and immunity products in high demand."),
    7:  ("Monsoon", ["Hot Beverages", "Corn", "Pakoda Mix", "Instant Noodles", "Bread", "Eggs", "Medicines", "Ginger"],
                    "Peak monsoon — comfort food and hot snacks. People stay indoors — ready-to-eat and instant food demand rises."),
    8:  ("Monsoon/Festival", ["Sweets", "Dry Fruits", "Pooja Items", "Rakhis", "Gift Boxes", "Modak", "Ghee"],
                    "Raksha Bandhan and Ganesh Chaturthi season — sweets, modak, and gift boxes are essentials. Stock up early."),
    9:  ("Festival Season", ["Sweets", "Dry Fruits", "Gift Hampers", "Navratri Items", "Fasting Foods", "Sabudana", "Kuttu Flour"],
                    "Navratri fasting season — sabudana, kuttu flour, and fasting snacks in high demand. Festival gifting picks up."),
    10: ("Diwali Season", ["Sweets", "Dry Fruits", "Diyas", "Candles", "Gift Boxes", "Snacks", "Namkeen", "Kaju Katli"],
                    "DIWALI — biggest retail season of the year. Stock sweets, dry fruits, and gift hampers 2–3 weeks ahead. Don't run out!"),
    11: ("Post-Diwali/Winter", ["Winter Vegetables", "Carrots", "Beets", "Green Leafy Veg", "Warm Clothes", "Hot Beverages"],
                    "Winter vegetables arrive — carrots, beets, spinach. Post-Diwali demand for fresh produce and healthy food rises."),
    12: ("Winter/Christmas", ["Cakes", "Plum Cake", "Chocolates", "Gift Packs", "Wine", "Nuts", "Christmas Snacks"],
                    "Christmas and New Year season — cakes, chocolates, and gift hampers. Year-end parties boost beverages and snacks."),
}

# Week-of-month upcoming festivals
FESTIVAL_ALERTS = [
    # (month, day_start, day_end, festival, products, priority)
    (1,  13, 16, "Pongal / Makar Sankranti", ["Rice", "Jaggery", "Sesame", "Sugarcane", "Turmeric"], "HIGH"),
    (1,  25, 31, "Republic Day", ["Sweets", "Snacks", "Flag Items"], "INFO"),
    (3,  20, 30, "Holi", ["Colours", "Sweets", "Cold Drinks", "Snacks"], "HIGH"),
    (4,   1, 20, "Tamil New Year / Vishu", ["Fruits", "Sweets", "Flowers", "New Clothes"], "HIGH"),
    (4,  10, 20, "Ram Navami", ["Fruits", "Sweets", "Prasad Items"], "MEDIUM"),
    (5,   1,  7, "Akshaya Tritiya", ["Gold", "Sweets", "New Items"], "MEDIUM"),
    (6,  10, 20, "Eid", ["Dates", "Sweets", "Biryani Items", "Gift Packs"], "HIGH"),
    (8,   1, 20, "Onam", ["Flowers", "Sadya Vegetables", "Payasam Items", "Plantain"], "HIGH"),
    (8,  15, 25, "Raksha Bandhan", ["Sweets", "Rakhis", "Dry Fruits", "Gift Boxes"], "HIGH"),
    (8,  25, 31, "Ganesh Chaturthi", ["Modak", "Coconut", "Flowers", "Sweets", "Pooja Items"], "HIGH"),
    (9,   1, 30, "Navratri", ["Sabudana", "Kuttu Flour", "Fruits", "Milk", "Fasting Snacks"], "HIGH"),
    (10,  1, 10, "Dussehra", ["Sweets", "Flowers", "Fruits"], "HIGH"),
    (10, 15, 31, "Diwali", ["Sweets", "Kaju Katli", "Dry Fruits", "Diyas", "Gift Boxes", "Namkeen"], "CRITICAL"),
    (11,  1, 30, "Kartik Month", ["Flowers", "Diyas", "Pooja Items"], "MEDIUM"),
    (12, 20, 31, "Christmas / New Year", ["Cakes", "Plum Cake", "Chocolates", "Wine", "Gift Packs"], "HIGH"),
]


class RecommendationService:
    def __init__(self):
        pass

    def generate_recommendations(self, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        recs = []
        now = datetime.datetime.utcnow()
        # Use IST (UTC+5:30) for Indian calendar accuracy
        ist_now = now + datetime.timedelta(hours=5, minutes=30)
        rec_id = 1

        # ── 1. INVENTORY ALERTS ──
        inv = metrics.get("inventory", {})
        if inv.get("out_of_stock_count", 0) > 0:
            recs.append({
                "id": rec_id, "type": "INVENTORY ALERT", "priority": "CRITICAL",
                "title": f"{inv['out_of_stock_count']} Items Out of Stock",
                "description": f"You have {inv['out_of_stock_count']} items completely out of stock. Reorder immediately to prevent lost sales.",
                "navigation": {"route": "/app/inventory", "params": {}, "query": "?filter=out_of_stock"},
                "created_at": now
            })
            rec_id += 1
        elif inv.get("critical_stock_count", 0) > 0:
            recs.append({
                "id": rec_id, "type": "INVENTORY ALERT", "priority": "HIGH",
                "title": f"{inv['critical_stock_count']} Items at Critical Levels",
                "description": f"Stock is critically low for {inv['critical_stock_count']} items.",
                "navigation": {"route": "/app/inventory", "params": {}, "query": "?filter=critical_stock"},
                "created_at": now
            })
            rec_id += 1

        # ── 2. TREND RECOMMENDATIONS ──
        trends = metrics.get("trends", {})
        top_cat = trends.get("top_category")
        if top_cat and top_cat != "N/A":
            recs.append({
                "id": rec_id, "type": "TREND ANALYSIS", "priority": "INFO",
                "title": f"{top_cat} is trending",
                "description": f"{top_cat} is your top performing category for this period. Consider prioritizing its stock.",
                "navigation": {"route": "/app/reports", "params": {}, "query": "?tab=trends"},
                "created_at": now
            })
            rec_id += 1

        # ── 3. HEALTH & CASHFLOW ──
        health = metrics.get("health", {})
        raw = metrics.get("raw", {})
        receivables = raw.get("receivables", 0)
        payables = raw.get("payables", 0)

        if health.get("status") in ["Warning", "Critical"]:
            recs.append({
                "id": rec_id, "type": "HEALTH ALERT", "priority": "HIGH",
                "title": "Business Health needs attention",
                "description": "Your overall business health score is dropping. Review your margins and inventory.",
                "navigation": {"route": "/app/reports", "params": {}, "query": "?tab=health"},
                "created_at": now
            })
            rec_id += 1

        if receivables > (payables * 1.5) and receivables > 0:
            recs.append({
                "id": rec_id, "type": "CASHFLOW ALERT", "priority": "MEDIUM",
                "title": "High Outstanding Receivables",
                "description": f"You have ₹{receivables:,.2f} pending from customers. Follow up to improve cash flow.",
                "navigation": {"route": "/app/customers", "params": {}, "query": "?filter=outstanding"},
                "created_at": now
            })
            rec_id += 1

        # ── 4. SEASONAL RECOMMENDATIONS (India) ──
        month = ist_now.month
        day = ist_now.day

        season_name, season_products, season_reason = INDIAN_SEASONAL_CALENDAR[month]

        recs.append({
            "id": rec_id, "type": "SEASONAL INSIGHT", "priority": "INFO",
            "title": f"🌤️ {season_name} Season — Stock Up Now",
            "description": f"{season_reason}\n\n📦 Recommended items: {', '.join(season_products[:6])}.",
            "navigation": {"route": "/app/inventory", "params": {}, "query": ""},
            "created_at": now
        })
        rec_id += 1

        # ── 5. UPCOMING FESTIVAL ALERTS (next 30 days) ──
        added_festivals = set()
        for (f_month, f_start, f_end, festival, products, priority) in FESTIVAL_ALERTS:
            # Check if festival is in current or next month within 30 days
            festival_start = datetime.date(ist_now.year, f_month, f_start)
            days_until = (festival_start - ist_now.date()).days

            # Show if festival is within next 30 days or currently happening
            if -3 <= days_until <= 30 and festival not in added_festivals:
                added_festivals.add(festival)
                if days_until < 0:
                    timing = f"🎉 {festival} is happening NOW!"
                    urgency = "CRITICAL" if priority == "HIGH" else priority
                elif days_until == 0:
                    timing = f"🎉 {festival} is TODAY!"
                    urgency = "CRITICAL"
                elif days_until <= 7:
                    timing = f"⚡ {festival} is in {days_until} days — stock up immediately!"
                    urgency = "HIGH"
                elif days_until <= 14:
                    timing = f"📅 {festival} is in {days_until} days — start stocking now."
                    urgency = priority
                else:
                    timing = f"📅 {festival} is in {days_until} days — plan your inventory."
                    urgency = "MEDIUM"

                recs.append({
                    "id": rec_id, "type": "FESTIVAL ALERT", "priority": urgency,
                    "title": f"🎊 {festival} Preparation",
                    "description": f"{timing}\n\n📦 Key items to stock: {', '.join(products)}.",
                    "navigation": {"route": "/app/purchases", "params": {}, "query": ""},
                    "created_at": now
                })
                rec_id += 1

        # ── 6. NEXT MONTH PREVIEW ──
        next_month = (month % 12) + 1
        next_season, next_products, _ = INDIAN_SEASONAL_CALENDAR[next_month]
        next_month_name = datetime.date(ist_now.year, next_month, 1).strftime('%B')

        recs.append({
            "id": rec_id, "type": "FORWARD PLANNING", "priority": "INFO",
            "title": f"📆 Prepare for {next_month_name} — {next_season}",
            "description": f"Next month brings {next_season} season. Start planning purchases for: {', '.join(next_products[:5])}.",
            "navigation": {"route": "/app/purchases", "params": {}, "query": ""},
            "created_at": now
        })
        rec_id += 1

        return recs