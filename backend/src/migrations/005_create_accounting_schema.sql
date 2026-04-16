-- ============================================================================
-- ACCOUNTING DASHBOARD SCHEMA
-- PostgreSQL Migration
-- ============================================================================

-- Customers (CRM / leads)
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  customer_type VARCHAR(50) DEFAULT 'retail', -- retail | wholesale | distributor
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);

-- Products (egg variants) 
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,         -- e.g. "Small Crate (30 eggs)", "Medium Crate (30 eggs)"
  unit VARCHAR(50),                    -- crate | dozen | tray | piece
  unit_price DECIMAL(10,2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  cost_per_unit DECIMAL(10,2),        -- Cost basis for expense calculation
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Sales (transactions)
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
  product_id INT REFERENCES products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK(quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  payment_method VARCHAR(50) DEFAULT 'cash', -- cash | transfer | credit | crypto
  payment_status VARCHAR(50) DEFAULT 'paid', -- paid | pending | overdue
  sale_date TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  invoice_number VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);

-- Inventory log (audit trail)
CREATE TABLE IF NOT EXISTS inventory_log (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  change_type VARCHAR(50),   -- restock | sale | adjustment | return
  quantity_change INT,
  reference_id INT,          -- Links to sales.id or restock request id
  note TEXT,
  logged_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_log_product ON inventory_log(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_log_date ON inventory_log(logged_at);

-- Expenses (business costs - separate from COGS)
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100),     -- transport | utilities | rent | marketing | other
  description VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  expense_date TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  receipt_path VARCHAR(255), -- Path to scanned receipt
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- ============================================================================
-- Insert sample data for testing (optional - can be removed in production)
-- ============================================================================

INSERT INTO customers (name, phone, email, address, customer_type) 
VALUES 
  ('John Doe', '+234 803 456 7890', 'john@example.com', '123 Aba Street', 'retail'),
  ('ABC Distributor', '+234 705 123 4567', 'bulk@abcdist.com', '456 Market Ave', 'wholesale'),
  ('XYZ Supermarket', '+234 812 345 6789', 'info@xyz.com', '789 Commerce Blvd', 'distributor')
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (name, unit, unit_price, cost_per_unit, stock_quantity, low_stock_threshold)
VALUES
  ('Small Eggs (30 per crate)', 'crate', 2800.00, 980.00, 50, 10),
  ('Medium Eggs (30 per crate)', 'crate', 3500.00, 1225.00, 35, 10),
  ('Large Eggs (30 per crate)', 'crate', 4200.00, 1470.00, 20, 10),
  ('Eggs Dozen', 'dozen', 1200.00, 420.00, 100, 20)
ON CONFLICT (name) DO NOTHING;
