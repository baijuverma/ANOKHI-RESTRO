
-- Run this in Supabase SQL Editor to add Discount and Payment columns

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_mode text DEFAULT 'cash';

-- Update the Order type in your frontend code will also be needed
