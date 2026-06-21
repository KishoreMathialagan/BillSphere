from fastapi import FastAPI

from app.db.session import engine, Base
from fastapi.middleware.cors import CORSMiddleware
from app.models import tenant, user, branch, inventory as inv_models, customer as cust_models, sales as sales_models, vendor as vendor_models, purchases as purchase_models

from sqlalchemy import text
Base.metadata.create_all(bind=engine)

# Inline database migration: Ensure first_name and last_name columns exist in users table
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN first_name VARCHAR"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN last_name VARCHAR"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE tenants ADD COLUMN logo_url VARCHAR"))
except Exception:
    pass

app = FastAPI(title="Bill Sphere API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://localhost:5173",
        "https://bill-sphere-zxwf.vercel.app",
        "https://bill-sphere-zxwf.vercel.app/"
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
    return {"status": "ok","API Version":"V2"}

from fastapi.responses import HTMLResponse
from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.session import get_db

@app.get("/admin", response_class=HTMLResponse)
def admin_panel(db: Session = Depends(get_db)):
    users = db.query(user.User).all()
    products = db.query(inv_models.Product).all()
    invoices = db.query(sales_models.Invoice).all()
    customers = db.query(cust_models.Customer).all()
    categories = db.query(inv_models.Category).all()
    
    cat_map = {c.category_id: c.name for c in categories}
    
    # Calculate statistics
    total_users = len(users)
    total_products = len(products)
    total_invoices = len(invoices)
    total_customers = len(customers)
    total_revenue = sum(inv.total_amount for inv in invoices)
    
    user_rows = ""
    for u in users:
        role_badge = f'<span class="badge badge-indigo">{u.role}</span>' if u.role == "Admin" else f'<span class="badge badge-violet">{u.role}</span>'
        user_rows += f"""
        <tr>
            <td><code class="text-muted">{u.user_id}</code></td>
            <td><strong>{u.first_name or ""} {u.last_name or ""}</strong></td>
            <td>{u.email}</td>
            <td>{role_badge}</td>
            <td><span class="text-muted">{u.tenant_id}</span></td>
        </tr>
        """
        
    product_rows = ""
    for p in products:
        cat_name = cat_map.get(p.category_id, "None")
        product_rows += f"""
        <tr>
            <td><code class="text-muted">{p.product_id}</code></td>
            <td><strong>{p.name}</strong></td>
            <td><span class="badge badge-indigo">{cat_name}</span></td>
            <td>{p.tax_rate}%</td>
            <td>{p.hsn_code or '<span class="text-muted">-</span>'}</td>
            <td><span class="text-muted">{p.tenant_id}</span></td>
        </tr>
        """
        
    invoice_rows = ""
    for inv in invoices:
        status_badge = ""
        if inv.status == "Paid":
            status_badge = f'<span class="badge badge-emerald">{inv.status}</span>'
        elif inv.status == "Unpaid":
            status_badge = f'<span class="badge badge-rose">{inv.status}</span>'
        else:
            status_badge = f'<span class="badge badge-amber">{inv.status}</span>'
            
        invoice_rows += f"""
        <tr>
            <td><code class="text-muted">{inv.invoice_id}</code></td>
            <td><strong>{inv.invoice_number}</strong></td>
            <td><code class="text-muted">{inv.customer_id or "Walk-in"}</code></td>
            <td><strong>₹{inv.total_amount:.2f}</strong></td>
            <td>₹{inv.outstanding_amount:.2f}</td>
            <td>{status_badge}</td>
            <td><span class="text-muted">{inv.created_at.strftime('%Y-%m-%d %H:%M') if inv.created_at else ''}</span></td>
        </tr>
        """
        
    customer_rows = ""
    for c in customers:
        customer_rows += f"""
        <tr>
            <td><code class="text-muted">{c.customer_id}</code></td>
            <td><strong>{c.name}</strong></td>
            <td>{c.phone or '<span class="text-muted">-</span>'}</td>
            <td>{c.email or '<span class="text-muted">-</span>'}</td>
            <td>{c.state or '<span class="text-muted">-</span>'}</td>
            <td>{c.gst_number or '<span class="text-muted">-</span>'}</td>
            <td><strong>₹{c.outstanding_balance:.2f}</strong></td>
        </tr>
        """
        
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BillSphere Admin Console</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Inter', sans-serif;
            }}
            body {{
                background-color: #0f172a;
                color: #f8fafc;
                min-height: 100vh;
                padding: 2rem;
            }}
            .container {{
                max-width: 1400px;
                margin: 0 auto;
            }}
            header {{
                margin-bottom: 2.5rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }}
            .logo-area {{
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }}
            .logo-icon {{
                width: 2.5rem;
                height: 2.5rem;
                background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                border-radius: 0.75rem;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                color: white;
                font-size: 1.25rem;
                box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
            }}
            .logo-title {{
                font-size: 1.5rem;
                font-weight: 700;
                letter-spacing: -0.025em;
                background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }}
            .stats-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2.5rem;
            }}
            .stat-card {{
                background: rgba(30, 41, 59, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 1rem;
                padding: 1.5rem;
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }}
            .stat-card:hover {{
                transform: translateY(-4px);
                border-color: rgba(99, 102, 241, 0.2);
                box-shadow: 0 10px 20px -10px rgba(0, 0, 0, 0.5);
            }}
            .stat-label {{
                font-size: 0.8rem;
                color: #94a3b8;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }}
            .stat-value {{
                font-size: 1.8rem;
                font-weight: 700;
                margin-top: 0.5rem;
                color: #fff;
            }}
            .main-content {{
                background: rgba(30, 41, 59, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 1.25rem;
                padding: 2rem;
                backdrop-filter: blur(10px);
            }}
            .tabs-header {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                padding-bottom: 1rem;
                margin-bottom: 1.5rem;
                flex-wrap: wrap;
                gap: 1rem;
            }}
            .tabs-buttons {{
                display: flex;
                gap: 0.5rem;
            }}
            .tab-btn {{
                background: transparent;
                border: none;
                color: #94a3b8;
                padding: 0.75rem 1.25rem;
                font-size: 0.95rem;
                font-weight: 500;
                cursor: pointer;
                border-radius: 0.5rem;
                transition: all 0.2s ease;
            }}
            .tab-btn:hover {{
                color: #fff;
                background: rgba(255, 255, 255, 0.03);
            }}
            .tab-btn.active {{
                color: #fff;
                background: rgba(99, 102, 241, 0.15);
                border: 1px solid rgba(99, 102, 241, 0.3);
            }}
            .search-box {{
                position: relative;
            }}
            .search-input {{
                background: #0f172a;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 0.5rem;
                padding: 0.6rem 1rem 0.6rem 1rem;
                color: #fff;
                font-size: 0.9rem;
                width: 250px;
                transition: all 0.2s ease;
            }}
            .search-input:focus {{
                outline: none;
                border-color: #6366f1;
                box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
            }}
            .tab-content {{
                display: none;
                animation: fadeIn 0.4s ease;
            }}
            .tab-content.active {{
                display: block;
            }}
            @keyframes fadeIn {{
                from {{ opacity: 0; transform: translateY(8px); }}
                to {{ opacity: 1; transform: translateY(0); }}
            }}
            .table-container {{
                overflow-x: auto;
                border-radius: 0.75rem;
                border: 1px solid rgba(255, 255, 255, 0.05);
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                text-align: left;
                font-size: 0.9rem;
            }}
            th {{
                background: rgba(15, 23, 42, 0.6);
                color: #94a3b8;
                font-weight: 600;
                padding: 1rem 1.25rem;
                text-transform: uppercase;
                font-size: 0.75rem;
                letter-spacing: 0.05em;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }}
            td {{
                padding: 1rem 1.25rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.02);
                color: #cbd5e1;
            }}
            tr:hover td {{
                background: rgba(255, 255, 255, 0.01);
            }}
            code {{
                background: rgba(255, 255, 255, 0.05);
                padding: 0.15rem 0.35rem;
                border-radius: 0.25rem;
                font-size: 0.8rem;
                color: #e2e8f0;
            }}
            .badge {{
                display: inline-flex;
                align-items: center;
                padding: 0.25rem 0.5rem;
                border-radius: 9999px;
                font-size: 0.75rem;
                font-weight: 500;
                text-transform: uppercase;
            }}
            .badge-indigo {{ background: rgba(99, 102, 241, 0.15); color: #818cf8; }}
            .badge-emerald {{ background: rgba(16, 185, 129, 0.15); color: #34d399; }}
            .badge-violet {{ background: rgba(139, 92, 246, 0.15); color: #a78bfa; }}
            .badge-rose {{ background: rgba(244, 63, 94, 0.15); color: #fb7185; }}
            .badge-amber {{ background: rgba(245, 158, 11, 0.15); color: #fbbf24; }}
            .text-muted {{
                font-size: 0.8rem;
                color: #64748b;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <div class="logo-area">
                    <div class="logo-icon">BS</div>
                    <div class="logo-title">BillSphere Admin Console</div>
                </div>
            </header>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-label">Total Users</span>
                    <span class="stat-value">{total_users}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Total Products</span>
                    <span class="stat-value">{total_products}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Total Invoices</span>
                    <span class="stat-value">{total_invoices}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Total Customers</span>
                    <span class="stat-value">{total_customers}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Total Revenue</span>
                    <span class="stat-value" style="color: #10b981;">₹{total_revenue:.2f}</span>
                </div>
            </div>
            
            <div class="main-content">
                <div class="tabs-header">
                    <div class="tabs-buttons">
                        <button class="tab-btn active" onclick="switchTab('users-tab')">Users</button>
                        <button class="tab-btn" onclick="switchTab('products-tab')">Products</button>
                        <button class="tab-btn" onclick="switchTab('invoices-tab')">Invoices</button>
                        <button class="tab-btn" onclick="switchTab('customers-tab')">Customers</button>
                    </div>
                    <div class="search-box">
                        <input type="text" id="search-bar" class="search-input" onkeyup="filterTable()" placeholder="Search current tab...">
                    </div>
                </div>
                
                <!-- Users Tab -->
                <div id="users-tab" class="tab-content active">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>User ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Tenant ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {user_rows if user_rows else '<tr><td colspan="5" style="text-align:center;">No users found</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Products Tab -->
                <div id="products-tab" class="tab-content">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Product ID</th>
                                    <th>Product Name</th>
                                    <th>Category</th>
                                    <th>Tax Rate</th>
                                    <th>HSN Code</th>
                                    <th>Tenant ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {product_rows if product_rows else '<tr><td colspan="6" style="text-align:center;">No products found</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Invoices Tab -->
                <div id="invoices-tab" class="tab-content">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Invoice ID</th>
                                    <th>Invoice Number</th>
                                    <th>Customer ID</th>
                                    <th>Total Amount</th>
                                    <th>Outstanding</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice_rows if invoice_rows else '<tr><td colspan="7" style="text-align:center;">No invoices found</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Customers Tab -->
                <div id="customers-tab" class="tab-content">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Customer ID</th>
                                    <th>Customer Name</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>State</th>
                                    <th>GST Number</th>
                                    <th>Outstanding Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customer_rows if customer_rows else '<tr><td colspan="7" style="text-align:center;">No customers found</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            function switchTab(tabId) {{
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                event.currentTarget.classList.add('active');
                document.getElementById(tabId).classList.add('active');
                
                // Clear search bar and reset rows
                document.getElementById('search-bar').value = '';
                filterTable();
            }}
            
            function filterTable() {{
                const query = document.getElementById('search-bar').value.toLowerCase();
                const activeTab = document.querySelector('.tab-content.active');
                const rows = activeTab.querySelectorAll('tbody tr');
                
                rows.forEach(row => {{
                    const text = row.innerText.toLowerCase();
                    // Skip 'no results found' row
                    if (row.cells.length === 1 && row.cells[0].innerText.includes('found')) return;
                    if (text.includes(query)) {{
                        row.style.display = '';
                    }} else {{
                        row.style.display = 'none';
                    }}
                }});
            }}
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
