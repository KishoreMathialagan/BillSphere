from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.services.forecasting import get_sales_forecast, get_inventory_demand_forecast

router = APIRouter()

@router.get("/sales")
def api_get_sales_forecast(days_history: int = 90, days_forecast: int = 30, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_sales_forecast(db, current_user.tenant_id, history_days=days_history, forecast_days=days_forecast)

@router.get("/inventory-demand")
def api_get_inventory_demand_forecast(velocity_days: int = 30, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_inventory_demand_forecast(db, current_user.tenant_id, velocity_days=velocity_days)
