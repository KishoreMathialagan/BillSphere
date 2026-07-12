import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
import time

from app.services.analytics_service import AnalyticsService
from app.services.recommendation_service import RecommendationService

class DashboardCache:
    _cache = {}
    _ttl = 60 # seconds

    @classmethod
    def get(cls, key: str) -> Optional[Dict[str, Any]]:
        if key in cls._cache:
            entry = cls._cache[key]
            if time.time() - entry['timestamp'] < cls._ttl:
                return entry['data']
            else:
                del cls._cache[key]
        return None

    @classmethod
    def set(cls, key: str, data: Dict[str, Any]):
        cls._cache[key] = {
            'timestamp': time.time(),
            'data': data
        }

    @classmethod
    def invalidate(cls, tenant_id: str):
        # Invalidate all keys starting with tenant_id
        keys_to_delete = [k for k in cls._cache.keys() if k.startswith(f"{tenant_id}:")]
        for k in keys_to_delete:
            del cls._cache[k]


class DashboardService:
    def __init__(self, db: Session, tenant_id: str, branch_id: Optional[str] = None):
        self.db = db
        self.tenant_id = tenant_id
        self.branch_id = branch_id
        self.analytics_svc = AnalyticsService(db, tenant_id, branch_id)
        self.rec_svc = RecommendationService()

    def get_dashboard_metrics(self, start_dt: datetime.datetime, end_dt: datetime.datetime) -> Dict[str, Any]:
        cache_key = f"{self.tenant_id}:{self.branch_id}:{start_dt.isoformat()}:{end_dt.isoformat()}"
        
        cached_data = DashboardCache.get(cache_key)
        if cached_data:
            return cached_data

        metrics = self.analytics_svc.get_dashboard_metrics(start_dt, end_dt)
        recommendations = self.rec_svc.generate_recommendations(metrics)
        
        # Remove raw data as it's not needed by the frontend schema
        metrics.pop("raw", None)
        
        metrics["recommendations"] = recommendations

        DashboardCache.set(cache_key, metrics)
        return metrics

    @staticmethod
    def trigger_update_event(tenant_id: str):
        """Call this method whenever a Sale, Purchase, or Inventory Adjustment is made."""
        DashboardCache.invalidate(tenant_id)
