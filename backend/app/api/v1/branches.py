from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.branch import Branch
from app.models.user import User
from app.schemas.branch import BranchCreate, BranchResponse
from app.api.dependencies import get_current_user

router = APIRouter()

@router.post("/", response_model=BranchResponse)
def create_branch(branch: BranchCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_branch = Branch(
        tenant_id=current_user.tenant_id,
        branch_name=branch.branch_name,
        address=branch.address
    )
    db.add(db_branch)
    db.commit()
    db.refresh(db_branch)
    return db_branch

@router.get("/", response_model=List[BranchResponse])
def get_branches(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Branch).filter(Branch.tenant_id == current_user.tenant_id).all()

@router.put("/{branch_id}", response_model=BranchResponse)
def update_branch(branch_id: str, branch: BranchCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_branch = db.query(Branch).filter(
        Branch.branch_id == branch_id,
        Branch.tenant_id == current_user.tenant_id
    ).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")
        
    db_branch.branch_name = branch.branch_name
    db_branch.address = branch.address
    db.commit()
    db.refresh(db_branch)
    return db_branch
