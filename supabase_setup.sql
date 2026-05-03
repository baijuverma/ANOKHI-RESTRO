-- ============================================
-- ANOKHI RESTRO - Supabase Database Setup SQL
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. INVENTORY TABLE
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'Veg',
  price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5
);

-- 2. SALES HISTORY TABLE
CREATE TABLE IF NOT EXISTS sales_history (
  id TEXT PRIMARY KEY,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  round_off NUMERIC NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL DEFAULT 'CASH',
  split_amounts JSONB,
  order_type TEXT NOT NULL DEFAULT 'DINE_IN',
  table_name TEXT,
  advance_paid NUMERIC NOT NULL DEFAULT 0,
  customer_name TEXT,
  customer_mobile TEXT,
  dues NUMERIC NOT NULL DEFAULT 0
);

-- 3. TABLES TABLE (Dine-In tables state)
CREATE TABLE IF NOT EXISTS tables (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cart JSONB NOT NULL DEFAULT '[]',
  advance NUMERIC NOT NULL DEFAULT 0,
  advance_mode TEXT NOT NULL DEFAULT 'CASH'
);

-- 4. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ DEFAULT NOW(),
    main_category TEXT NOT NULL,
    sub_category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_mode TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 6. ALLOW ALL OPERATIONS (anon users - for local POS use)
CREATE POLICY "anon_all_inventory" ON inventory FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_sales" ON sales_history FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_tables" ON tables FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_expenses" ON expenses FOR ALL TO anon USING (true) WITH CHECK (true);
