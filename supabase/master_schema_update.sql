
-- ========================================================
-- MASTER SCHEMA UPDATE FOR ANOKHI-RESTRO
-- Run this in Supabase SQL Editor (one by one or all at once)
-- ========================================================

-- 1. INVENTORY TABLE
CREATE TABLE IF NOT EXISTS public.inventory (
    id text PRIMARY KEY,
    name text NOT NULL,
    category text,
    item_type text DEFAULT 'Veg',
    price numeric DEFAULT 0,
    quantity numeric DEFAULT 0,
    low_stock_threshold numeric DEFAULT 5,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. TABLES (FOR POS)
CREATE TABLE IF NOT EXISTS public.tables (
    id text PRIMARY KEY,
    name text NOT NULL,
    cart jsonb DEFAULT '[]'::jsonb,
    advance numeric DEFAULT 0,
    advance_mode text DEFAULT 'Cash',
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. ACTIVE ORDERS (UNSETTLED BILLS)
CREATE TABLE IF NOT EXISTS public.active_orders (
    id text PRIMARY KEY,
    order_type text,
    items jsonb DEFAULT '[]'::jsonb,
    total numeric DEFAULT 0,
    discount numeric DEFAULT 0,
    round_off numeric DEFAULT 0,
    customer_name text,
    customer_mobile text,
    table_name text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 4. SALES HISTORY (SETTLED BILLS)
CREATE TABLE IF NOT EXISTS public.sales_history (
    id text PRIMARY KEY,
    date timestamp with time zone DEFAULT timezone('utc'::text, now()),
    items jsonb DEFAULT '[]'::jsonb,
    total numeric DEFAULT 0,
    discount numeric DEFAULT 0,
    round_off numeric DEFAULT 0,
    payment_mode text DEFAULT 'Cash',
    split_amounts jsonb DEFAULT '{}'::jsonb,
    order_type text,
    table_name text,
    table_id text,
    advance_paid numeric DEFAULT 0,
    customer_name text,
    customer_mobile text,
    dues numeric DEFAULT 0
);

-- 5. EXPENSES TABLE (UPDATED WITH ALL NEW FIELDS)
CREATE TABLE IF NOT EXISTS public.expenses (
    id text PRIMARY KEY,
    date timestamp with time zone DEFAULT timezone('utc'::text, now()),
    main_category text,
    sub_category text,
    amount numeric DEFAULT 0, -- Total/Net amount for legacy
    cash numeric DEFAULT 0,
    upi numeric DEFAULT 0,
    udhar numeric DEFAULT 0,
    description text,
    qty numeric DEFAULT 0,
    unit text DEFAULT 'QTY',
    selling_price numeric DEFAULT 0,
    gross_amount numeric DEFAULT 0,
    discount_percent numeric DEFAULT 0,
    discount_fixed numeric DEFAULT 0,
    net_amount numeric DEFAULT 0
);

-- 6. ENSURE COLUMNS EXIST (If tables already existed)
-- Inventory
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS item_type text DEFAULT 'Veg';
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS low_stock_threshold numeric DEFAULT 5;

-- Tables
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS advance numeric DEFAULT 0;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS advance_mode text DEFAULT 'Cash';

-- Sales History
ALTER TABLE public.sales_history ADD COLUMN IF NOT EXISTS split_amounts jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.sales_history ADD COLUMN IF NOT EXISTS dues numeric DEFAULT 0;
ALTER TABLE public.sales_history ADD COLUMN IF NOT EXISTS advance_paid numeric DEFAULT 0;
ALTER TABLE public.sales_history ADD COLUMN IF NOT EXISTS order_type text;

-- Expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS main_category text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS sub_category text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS cash numeric DEFAULT 0;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS upi numeric DEFAULT 0;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS udhar numeric DEFAULT 0;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS qty numeric DEFAULT 0;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS unit text DEFAULT 'QTY';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS selling_price numeric DEFAULT 0;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS gross_amount numeric DEFAULT 0;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS discount_fixed numeric DEFAULT 0;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS net_amount numeric DEFAULT 0;
