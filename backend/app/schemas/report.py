from pydantic import BaseModel
from typing import List

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

class DashboardMetricsResponse(BaseModel):
    total_sales: float
    total_purchases: float
    total_revenue: float
    total_expenses: float
    net_profit: float
    gst_collected: float
    customer_count: int
    vendor_count: int
    outstanding_receivables: float
    outstanding_payables: float
    inventory_value: float
    top_products: List[TopItem]
    top_categories: List[TopItem]
