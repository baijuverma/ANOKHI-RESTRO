
-- 1. Ensure extensions exist
create extension if not exists "uuid-ossp";

-- 2. Drop existing triggers to avoid conflicts
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 3. Create Tables if not exist (and add columns if missing)
-- USERS
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  restaurant_id uuid, 
  role text check (role in ('admin', 'staff')) default 'staff',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RESTAURANTS
create table if not exists public.restaurants (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  gst_number text,
  address text,
  phone text,
  logo_url text,
  gst_enabled boolean default false,
  gst_percentage numeric default 5.0,
  printer_size text check (printer_size in ('58mm', '80mm')) default '80mm',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  owner_id uuid references public.users(id)
);

-- Add foreign key to users if not mistakenly added
do $$
begin
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'users_restaurant_id_fkey') then
    alter table public.users
    add constraint users_restaurant_id_fkey
    foreign key (restaurant_id) references public.restaurants(id);
  end if;
end $$;

-- ITEMS
create table if not exists public.items (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.restaurants(id) not null,
  name text not null,
  category text,
  price numeric not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ORDERS
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.restaurants(id) not null,
  bill_number serial,
  customer_name text,
  customer_phone text,
  gst_enabled boolean default false,
  subtotal numeric not null,
  gst_amount numeric default 0,
  total numeric not null,
  payment_method text default 'cash',
  status text default 'completed',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ORDER ITEMS
create table if not exists public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  item_id uuid references public.items(id),
  item_name text not null,
  quantity integer not null,
  price numeric not null,
  total_price numeric not null
);

-- 4. Enable RLS
alter table public.users enable row level security;
alter table public.restaurants enable row level security;
alter table public.items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- 5. Create Improved Trigger Function
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_restaurant_id uuid;
begin
  -- Create a default restaurant for the user
  insert into public.restaurants (name, owner_id)
  values ('My Restaurant', new.id)
  returning id into new_restaurant_id;

  -- Create user profile linked to restaurant
  insert into public.users (id, role, restaurant_id)
  values (new.id, 'admin', new_restaurant_id);
  
  return new;
end;
$$ language plpgsql security definer;

-- 6. Attach Trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Fix existing users with no profile or restaurant
do $$
declare
  r record;
  new_rest_id uuid;
begin
  for r in select * from auth.users loop
    -- If user profile missing
    if not exists (select 1 from public.users where id = r.id) then
        insert into public.restaurants (name, owner_id) values ('My Restaurant', r.id) returning id into new_rest_id;
        insert into public.users (id, role, restaurant_id) values (r.id, 'admin', new_rest_id);
    -- If user exists but has no restaurant
    elsif exists (select 1 from public.users where id = r.id and restaurant_id is null) then
        insert into public.restaurants (name, owner_id) values ('My Restaurant', r.id) returning id into new_rest_id;
        update public.users set restaurant_id = new_rest_id where id = r.id;
    end if;
  end loop;
end;
$$;

-- 8. Re-apply Policies (Drop first to avoid errors)
drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Users can view assigned restaurant" on public.restaurants;
drop policy if exists "Admins can update restaurant" on public.restaurants;
drop policy if exists "View items of own restaurant" on public.items;
drop policy if exists "Admins manage items" on public.items;
drop policy if exists "View orders of own restaurant" on public.orders;
drop policy if exists "Create orders" on public.orders;

-- Policy Definitions
create policy "Users can view own profile" on public.users for select using ( auth.uid() = id );
create policy "Users can update own profile" on public.users for update using ( auth.uid() = id );

create policy "Users can view assigned restaurant" on public.restaurants for select using ( 
    id in (select restaurant_id from public.users where id = auth.uid()) or owner_id = auth.uid() 
);

create policy "Admins can update restaurant" on public.restaurants for update using ( owner_id = auth.uid() );

create policy "View items of own restaurant" on public.items for select using ( 
    restaurant_id in (select restaurant_id from public.users where id = auth.uid()) 
);

create policy "Admins manage items" on public.items for all using ( 
    restaurant_id in (select restaurant_id from public.users where id = auth.uid() and role = 'admin') 
);

create policy "View orders of own restaurant" on public.orders for select using ( 
    restaurant_id in (select restaurant_id from public.users where id = auth.uid()) 
);

create policy "Create orders" on public.orders for insert with check ( 
    restaurant_id in (select restaurant_id from public.users where id = auth.uid()) 
);

