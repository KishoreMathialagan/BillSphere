import { SQLocal } from 'sqlocal';

// Initialize sqlocal which wraps OPFS SQLite
export const sqlocal = new SQLocal('billsphere.sqlite3');

export const initDb = async () => {
  await sqlocal.sql`
    CREATE TABLE IF NOT EXISTS local_products (
      variant_id TEXT PRIMARY KEY,
      product_id TEXT,
      product_name TEXT,
      category_id TEXT,
      hsn_code TEXT,
      tax_rate REAL,
      barcode TEXT,
      sku TEXT,
      selling_price REAL
    );
  `;

  await sqlocal.sql`
    CREATE TABLE IF NOT EXISTS local_customers (
      customer_id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      email TEXT,
      state TEXT,
      gst_number TEXT,
      credit_limit REAL,
      outstanding_balance REAL
    );
  `;

  await sqlocal.sql`
    CREATE TABLE IF NOT EXISTS local_inventory (
      variant_id TEXT PRIMARY KEY,
      quantity INTEGER
    );
  `;

  await sqlocal.sql`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payload TEXT,
      created_at TEXT
    );
  `;
};

// Data access functions
export const saveProducts = async (products: any[]) => {
  // Clear existing to avoid manual updates during sync
  await sqlocal.sql`DELETE FROM local_products`;
  for (const p of products) {
    for (const v of p.variants || []) {
      await sqlocal.sql`
        INSERT INTO local_products 
        (variant_id, product_id, product_name, category_id, hsn_code, tax_rate, barcode, sku, selling_price)
        VALUES (${v.variant_id}, ${p.product_id}, ${p.name}, ${p.category_id}, ${p.hsn_code || ''}, ${Number(p.tax_rate || 0)}, ${v.barcode || ''}, ${v.sku || ''}, ${Number(v.selling_price || 0)})
      `;
    }
  }
};

export const saveCustomers = async (customers: any[]) => {
  await sqlocal.sql`DELETE FROM local_customers`;
  for (const c of customers) {
    await sqlocal.sql`
      INSERT INTO local_customers 
      (customer_id, name, phone, email, state, gst_number, credit_limit, outstanding_balance)
      VALUES (${c.customer_id}, ${c.name}, ${c.phone}, ${c.email}, ${c.state}, ${c.gst_number}, ${c.credit_limit}, ${c.outstanding_balance})
    `;
  }
};

export const saveInventory = async (inventory: any[]) => {
  await sqlocal.sql`DELETE FROM local_inventory`;
  for (const inv of inventory) {
    await sqlocal.sql`
      INSERT INTO local_inventory (variant_id, quantity)
      VALUES (${inv.variant_id}, ${inv.quantity})
    `;
  }
};

export const getProducts = async () => {
  const result = await sqlocal.sql`SELECT * FROM local_products`;
  return result; // sqlocal returns array of objects
};

export const getCustomers = async () => {
  return await sqlocal.sql`SELECT * FROM local_customers`;
};

export const getInventoryByVariant = async (variant_id: string) => {
  const result = await sqlocal.sql`SELECT quantity FROM local_inventory WHERE variant_id = ${variant_id}`;
  return result.length > 0 ? result[0].quantity : 0;
};

export const decrementInventoryLocal = async (variant_id: string, qty: number) => {
  const current = await getInventoryByVariant(variant_id);
  await sqlocal.sql`UPDATE local_inventory SET quantity = ${current - qty} WHERE variant_id = ${variant_id}`;
};

export const enqueueInvoice = async (invoicePayload: any) => {
  await sqlocal.sql`
    INSERT INTO sync_queue (payload, created_at)
    VALUES (${JSON.stringify(invoicePayload)}, ${new Date().toISOString()})
  `;
};

export const getSyncQueue = async () => {
  return await sqlocal.sql`SELECT * FROM sync_queue ORDER BY id ASC`;
};

export const removeFromQueue = async (id: number) => {
  await sqlocal.sql`DELETE FROM sync_queue WHERE id = ${id}`;
};
