from sqlalchemy.orm import Session
from app.models.accounting import Account, JournalEntry, JournalLine
import datetime

DEFAULT_ACCOUNTS = [
    {"code": "1000", "name": "Cash", "type": "Asset", "tag": "CASH"},
    {"code": "1010", "name": "Bank", "type": "Asset", "tag": "BANK"},
    {"code": "1200", "name": "Accounts Receivable", "type": "Asset", "tag": "AR"},
    {"code": "1300", "name": "Inventory", "type": "Asset", "tag": "INVENTORY"},
    {"code": "2000", "name": "Accounts Payable", "type": "Liability", "tag": "AP"},
    {"code": "2201", "name": "Output CGST Payable", "type": "Liability", "tag": "CGST_OUT"},
    {"code": "2202", "name": "Output SGST Payable", "type": "Liability", "tag": "SGST_OUT"},
    {"code": "2203", "name": "Output IGST Payable", "type": "Liability", "tag": "IGST_OUT"},
    {"code": "3000", "name": "Retained Earnings", "type": "Equity", "tag": "RETAINED_EARNINGS"},
    {"code": "4000", "name": "Sales Revenue", "type": "Revenue", "tag": "SALES"},
    {"code": "4100", "name": "Sales Return", "type": "Revenue", "tag": "SALES_RETURN"},
    {"code": "5000", "name": "Cost of Goods Sold", "type": "Expense", "tag": "COGS"},
    {"code": "5100", "name": "Purchase Account", "type": "Expense", "tag": "PURCHASES"},
    {"code": "5110", "name": "Purchase Return", "type": "Expense", "tag": "PURCHASE_RETURN"},
    {"code": "1401", "name": "Input CGST Credit", "type": "Asset", "tag": "CGST_IN"},
    {"code": "1402", "name": "Input SGST Credit", "type": "Asset", "tag": "SGST_IN"},
    {"code": "1403", "name": "Input IGST Credit", "type": "Asset", "tag": "IGST_IN"},
    {"code": "5300", "name": "Discounts Given", "type": "Expense", "tag": "DISCOUNTS_GIVEN"}
]

def setup_default_accounts(db: Session, tenant_id: str):
    for acc in DEFAULT_ACCOUNTS:
        existing = db.query(Account).filter(Account.tenant_id == tenant_id, Account.system_tag == acc["tag"]).first()
        if not existing:
            new_acc = Account(
                tenant_id=tenant_id,
                account_name=acc["name"],
                account_code=acc["code"],
                account_type=acc["type"],
                is_system_account=True,
                system_tag=acc["tag"]
            )
            db.add(new_acc)
    db.commit()

def post_system_journal(db: Session, tenant_id: str, entry_date: datetime.datetime, reference: str, description: str, source_entity: str, source_id: str, entries: list, user_id: str = None):
    # entries is a list of dicts: [{"tag": "CASH", "debit": 100, "credit": 0}, ...]
    
    # Validation: Debits == Credits
    total_debit = round(sum([e.get("debit", 0) for e in entries]), 2)
    total_credit = round(sum([e.get("credit", 0) for e in entries]), 2)

    if total_debit != total_credit:
        raise ValueError(f"Journal does not balance. Dr: {total_debit}, Cr: {total_credit}")

    if total_debit == 0 and total_credit == 0:
        return None # Nothing to post

    # Fetch accounts
    tags = [e["tag"] for e in entries if "tag" in e]
    accounts = db.query(Account).filter(Account.tenant_id == tenant_id, Account.system_tag.in_(tags)).all()
    account_map = {a.system_tag: a.account_id for a in accounts}

    journal = JournalEntry(
        tenant_id=tenant_id,
        entry_date=entry_date,
        reference=reference,
        description=description,
        source_entity=source_entity,
        source_id=source_id,
        created_by_user_id=user_id
    )
    db.add(journal)
    db.flush()

    for entry in entries:
        if entry.get("debit", 0) == 0 and entry.get("credit", 0) == 0:
            continue
            
        account_id = None
        if "tag" in entry:
            account_id = account_map.get(entry["tag"])
            if not account_id:
                raise ValueError(f"System account for tag {entry['tag']} not found for tenant")
        elif "account_id" in entry:
            account_id = entry["account_id"]

        line = JournalLine(
            journal_id=journal.journal_id,
            account_id=account_id,
            debit=entry.get("debit", 0),
            credit=entry.get("credit", 0)
        )
        db.add(line)
    
    db.commit()
    db.refresh(journal)
    return journal
