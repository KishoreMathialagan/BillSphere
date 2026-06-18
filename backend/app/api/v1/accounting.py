from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import datetime
from app.db.session import get_db
from app.models.accounting import Account, JournalEntry, JournalLine
from app.models.user import User
from app.schemas.accounting import AccountCreate, AccountResponse, JournalEntryCreate, JournalEntryResponse
from app.api.dependencies import get_current_user

router = APIRouter()

@router.get("/accounts", response_model=List[AccountResponse])
def get_accounts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Account).filter(Account.tenant_id == current_user.tenant_id).order_by(Account.account_code).all()

@router.get("/journals", response_model=List[JournalEntryResponse])
def get_journals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(JournalEntry).filter(JournalEntry.tenant_id == current_user.tenant_id).order_by(JournalEntry.entry_date.desc()).all()

@router.get("/profit-and-loss")
def get_profit_and_loss(
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(
        Account.account_type,
        Account.account_name,
        func.sum(JournalLine.credit - JournalLine.debit).label("balance")
    ).join(JournalLine).join(JournalEntry).filter(
        Account.tenant_id == current_user.tenant_id,
        Account.account_type.in_(["Revenue", "Expense"])
    )

    if start_date:
        query = query.filter(JournalEntry.entry_date >= datetime.datetime.combine(start_date, datetime.time.min))
    if end_date:
        query = query.filter(JournalEntry.entry_date <= datetime.datetime.combine(end_date, datetime.time.max))

    results = query.group_by(Account.account_type, Account.account_name).all()

    revenue = []
    expenses = []
    total_revenue = 0
    total_expense = 0

    for r in results:
        val = r.balance or 0
        if r.account_type == "Revenue":
            revenue.append({"account": r.account_name, "amount": val})
            total_revenue += val
        elif r.account_type == "Expense":
            # For expenses, a debit balance is positive expense. (credit - debit) will be negative.
            # So we invert it for display purposes.
            expense_val = -val
            expenses.append({"account": r.account_name, "amount": expense_val})
            total_expense += expense_val

    net_profit = total_revenue - total_expense

    return {
        "revenue": revenue,
        "total_revenue": total_revenue,
        "expenses": expenses,
        "total_expense": total_expense,
        "net_profit": net_profit
    }

@router.get("/balance-sheet")
def get_balance_sheet(
    end_date: Optional[datetime.date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(
        Account.account_type,
        Account.account_name,
        func.sum(JournalLine.debit - JournalLine.credit).label("debit_balance") # Assets are debit normal
    ).join(JournalLine).join(JournalEntry).filter(
        Account.tenant_id == current_user.tenant_id,
        Account.account_type.in_(["Asset", "Liability", "Equity"])
    )

    if end_date:
        query = query.filter(JournalEntry.entry_date <= datetime.datetime.combine(end_date, datetime.time.max))

    results = query.group_by(Account.account_type, Account.account_name).all()

    assets = []
    liabilities = []
    equity = []
    total_assets = 0
    total_liabilities = 0
    total_equity = 0

    for r in results:
        val = r.debit_balance or 0
        if r.account_type == "Asset":
            assets.append({"account": r.account_name, "amount": val})
            total_assets += val
        elif r.account_type == "Liability":
            liab_val = -val # Liabilities are credit normal
            liabilities.append({"account": r.account_name, "amount": liab_val})
            total_liabilities += liab_val
        elif r.account_type == "Equity":
            eq_val = -val # Equity is credit normal
            equity.append({"account": r.account_name, "amount": eq_val})
            total_equity += eq_val

    # Need to add current period Net Profit to Retained Earnings
    pnl_query = db.query(
        func.sum(JournalLine.credit - JournalLine.debit).label("net_profit")
    ).join(JournalLine).join(JournalEntry).join(Account).filter(
        Account.tenant_id == current_user.tenant_id,
        Account.account_type.in_(["Revenue", "Expense"])
    )
    if end_date:
        pnl_query = pnl_query.filter(JournalEntry.entry_date <= datetime.datetime.combine(end_date, datetime.time.max))
        
    net_profit = pnl_query.scalar() or 0
    equity.append({"account": "Current Period Net Profit", "amount": net_profit})
    total_equity += net_profit

    return {
        "assets": assets,
        "total_assets": total_assets,
        "liabilities": liabilities,
        "total_liabilities": total_liabilities,
        "equity": equity,
        "total_equity": total_equity
    }
