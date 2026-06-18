from fastapi import FastAPI

from app.db.session import engine, Base
from fastapi.middleware.cors import CORSMiddleware
from app.models import tenant, user, branch, inventory as inv_models, customer as cust_models, sales as sales_models, vendor as vendor_models, purchases as purchase_models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bill Sphere API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://bill-sphere-zxwf.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.v1 import setup, auth, inventory, sales, vendor, customer, reports, branches, transfers, accounting, gst, assistant, forecasting

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(setup.router, prefix="/api/v1/setup", tags=["setup"])
app.include_router(inventory.router, prefix="/api/v1/inventory", tags=["inventory"])
app.include_router(customer.router, prefix="/api/v1/customers", tags=["customers"])
app.include_router(vendor.router, prefix="/api/v1/vendors", tags=["vendors"])
app.include_router(sales.router, prefix="/api/v1/sales", tags=["sales"])
app.include_router(branches.router, prefix="/api/v1/branches", tags=["branches"])
app.include_router(transfers.router, prefix="/api/v1/transfers", tags=["transfers"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["reports"])
app.include_router(accounting.router, prefix="/api/v1/accounting", tags=["Accounting"])
app.include_router(gst.router, prefix="/api/v1/gst", tags=["GST"])
app.include_router(assistant.router, prefix="/api/v1/assistant", tags=["AI Assistant"])
app.include_router(forecasting.router, prefix="/api/v1/forecasting", tags=["Forecasting"])

@app.get("/")
def root():
    return {"message": "Welcome to Bill Sphere API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
