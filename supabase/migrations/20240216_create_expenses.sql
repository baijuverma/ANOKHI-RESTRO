
-- Create expenses table
create table if not exists public.expenses (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    restaurant_id uuid references public.restaurants(id),
    category text not null, -- 'cogs', 'labor', 'rent_utilities', 'marketing', 'misc'
    amount numeric not null,
    description text,
    expense_date date not null default CURRENT_DATE
);

-- Add RLS policies (optional but recommended)
alter table public.expenses enable row level security;

create policy "Enable all access for authenticated users" 
on public.expenses for all 
using (true) 
with check (true);
