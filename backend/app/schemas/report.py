from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import datetime

class BranchReportItem(BaseModel):
    branch_id: str
    branch_name: str
    total_sales: float
    inventory_value: float
    exception_count: int

class BranchReportResponse(BaseModel):
    tenant_id: str
    reports: List[BranchReportItem]

class TopItem(BaseModel):
    name: str
    amount: float

class BaseKPI(BaseModel):
    value: float
    change: float
    trend: str
    last_updated: datetime.datetime

class RevenueMetrics(BaseModel):
    current_revenue: BaseKPI
    previous_revenue: BaseKPI

class InvoiceMetrics(BaseModel):
    count: BaseKPI
    average_amount: BaseKPI
    highest_amount: float
    lowest_amount: float

class InventoryMetrics(BaseModel):
    low_stock_count: int
    critical_stock_count: int
    out_of_stock_count: int

class HealthMetrics(BaseModel):
    score: int
    status: str
    components: Dict[str, float]

class SalesTrendPoint(BaseModel):
    date: str
    sales: float

class SalesSeries(BaseModel):
    interval: str
    start_date: str
    end_date: str
    points: List[SalesTrendPoint]

class TrendMetrics(BaseModel):
    sales_series: SalesSeries
    top_product: str
    top_category: str
    fastest_growing_product: str
    highest_profit_product: str
    slow_moving_product: str

class RecommendationNavigation(BaseModel):
    route: str
    params: Dict[str, Any]
    query: str

class DashboardRecommendation(BaseModel):
    id: int
    type: str
    priority: str
    title: str
    description: str
    navigation: RecommendationNavigation
    created_at: datetime.datetime

class DashboardMetricsResponse(BaseModel):
    revenue: RevenueMetrics
    invoices: InvoiceMetrics
    inventory: InventoryMetrics
    health: HealthMetrics
    trends: TrendMetrics
    recommendations: List[DashboardRecommendation]
