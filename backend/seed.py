import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base, engine
from app.models.tenant import Tenant
from app.models.user import User
from app.core.security import get_password_hash

def seed_db():
    Session = sessionmaker(bind=engine)
    session = Session()

    # Check if tenant exists
    tenant = session.query(Tenant).filter_by(business_name="Demo Retailer").first()
    if not tenant:
        print("Seeding Tenant...")
        tenant = Tenant(
            business_name="Demo Retailer"
        )
        session.add(tenant)
        session.commit()
        session.refresh(tenant)
        
    # Check if admin user exists
    admin = session.query(User).filter_by(email="admin@demo.com").first()
    if not admin:
        print("Seeding Admin User...")
        admin = User(
            email="admin@demo.com",
            password_hash=get_password_hash("password123"),
            role="Admin",
            tenant_id=tenant.tenant_id
        )
        session.add(admin)
        session.commit()
        
    print("Database seeded successfully.")
    session.close()

if __name__ == "__main__":
    seed_db()
