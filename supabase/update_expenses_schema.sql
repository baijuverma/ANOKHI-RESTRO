
-- RUN THIS IN SUPABASE SQL EDITOR TO UPDATE EXPENSES TABLE
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

-- Ensure sales_history is also updated for split payments if not already
ALTER TABLE public.sales_history ADD COLUMN IF NOT EXISTS split_amounts jsonb;
ALTER TABLE public.sales_history ADD COLUMN IF NOT EXISTS dues numeric DEFAULT 0;
ALTER TABLE public.sales_history ADD COLUMN IF NOT EXISTS order_type text;
ALTER TABLE public.sales_history ADD COLUMN IF NOT EXISTS advance_paid numeric DEFAULT 0;
