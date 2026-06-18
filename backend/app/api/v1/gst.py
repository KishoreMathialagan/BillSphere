from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import datetime
from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.sales import Invoice
from app.models.purchases import Purchase
from app.models.accounting import JournalEntry, JournalLine, Account

router = APIRouter()

@router.get("/gstr1", response_model=List[Dict[str, Any]])
def get_gstr1(start_date: datetime.date, end_date: datetime.date, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Outward Supplies (Sales)
    invoices = db.query(Invoice).filter(
        Invoice.tenant_id == current_user.tenant_id,
        Invoice.created_at >= datetime.datetime.combine(start_date, datetime.time.min),
        Invoice.created_at <= datetime.datetime.combine(end_date, datetime.time.max)
    ).all()
    
    report = []
    for inv in invoices:
        report.append({
            "invoice_number": inv.invoice_number,
            "date": inv.created_at.isoformat(),
            "customer_id": inv.customer_id,
            "place_of_supply": inv.place_of_supply,
            "total_value": inv.total_amount,
            "taxable_value": inv.total_amount - inv.total_tax,
            "total_cgst": inv.total_cgst,
            "total_sgst": inv.total_sgst,
            "total_igst": inv.total_igst
        })
    return report

@router.get("/gstr2", response_model=List[Dict[str, Any]])
def get_gstr2(start_date: datetime.date, end_date: datetime.date, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Inward Supplies (Purchases)
    purchases = db.query(Purchase).filter(
        Purchase.tenant_id == current_user.tenant_id,
        Purchase.created_at >= datetime.datetime.combine(start_date, datetime.time.min),
        Purchase.created_at <= datetime.datetime.combine(end_date, datetime.time.max)
    ).all()
    
    report = []
    for pur in purchases:
        report.append({
            "purchase_number": pur.purchase_number,
            "date": pur.created_at.isoformat(),
            "vendor_id": pur.vendor_id,
            "place_of_supply": pur.place_of_supply,
            "total_value": pur.total_amount,
            "taxable_value": pur.total_amount - pur.total_tax,
            "total_cgst": pur.total_cgst,
            "total_sgst": pur.total_sgst,
            "total_igst": pur.total_igst
        })
    return report

@router.get("/gstr3b", response_model=Dict[str, Any])
def get_gstr3b(start_date: datetime.date, end_date: datetime.date, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Summary of Outward and Inward Supplies
    gstr1 = get_gstr1(start_date, end_date, db, current_user)
    gstr2 = get_gstr2(start_date, end_date, db, current_user)
    
    total_outward_taxable = sum(i["taxable_value"] for i in gstr1)
    total_outward_cgst = sum(i["total_cgst"] for i in gstr1)
    total_outward_sgst = sum(i["total_sgst"] for i in gstr1)
    total_outward_igst = sum(i["total_igst"] for i in gstr1)
    
    total_itc_cgst = sum(i["total_cgst"] for i in gstr2)
    total_itc_sgst = sum(i["total_sgst"] for i in gstr2)
    total_itc_igst = sum(i["total_igst"] for i in gstr2)
    
    return {
        "outward_supplies": {
            "taxable_value": total_outward_taxable,
            "cgst": total_outward_cgst,
            "sgst": total_outward_sgst,
            "igst": total_outward_igst
        },
        "eligible_itc": {
            "cgst": total_itc_cgst,
            "sgst": total_itc_sgst,
            "igst": total_itc_igst
        },
        "net_liability": {
            "cgst": max(0, total_outward_cgst - total_itc_cgst),
            "sgst": max(0, total_outward_sgst - total_itc_sgst),
            "igst": max(0, total_outward_igst - total_itc_igst)
        }
    }
