
-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- USERS TABLE (Linked to Auth)
create table public.users (
  id uuid references auth.users not null primary key,
  restaurant_id uuid, -- Will be foreign key after restaurant table creation
  role text check (role in ('admin', 'staff')) default 'staff',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RESTAURANTS TABLE
create table public.restaurants (
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

-- Update users table with foreign key
alter table public.users
add constraint users_restaurant_id_fkey
foreign key (restaurant_id) references public.restaurants(id);

-- ITEMS TABLE
create table public.items (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.restaurants(id) not null,
  name text not null,
  category text,
  price numeric not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ORDERS TABLE
create table public.orders (
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

-- ORDER ITEMS TABLE
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  item_id uuid references public.items(id), -- Nullable in case item is deleted, or keep it strict
  item_name text not null, -- Store name in case item changes
  quantity integer not null,
  price numeric not null,
  total_price numeric not null -- stored for convenience
);

-- DATABSE FUNCTIONS
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, role)
  values (new.id, 'admin'); -- Default first user as admin, logic can be adjusted
  return new;
end;
$$ language plpgsql security definer;

-- TRIGGER FOR NEW USER
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ROW LEVEL SECURITY (RLS)
alter table public.users enable row level security;
alter table public.restaurants enable row level security;
alter table public.items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- POLICIES

-- Users: specific user can view their own profile
create policy "Users can view own profile"
  on public.users for select
  using ( auth.uid() = id );

-- Users: specific user can update their own profile
create policy "Users can update own profile"
  on public.users for update
  using ( auth.uid() = id );

-- Restaurants: Users can view their assigned restaurant
create policy "Users can view assigned restaurant"
  on public.restaurants for select
  using ( 
    id in (
      select restaurant_id from public.users where id = auth.uid()
    )
    or
    owner_id = auth.uid() 
  );

-- Restaurants: Only admin (owner) can update restaurant
create policy "Admins can update restaurant"
  on public.restaurants for update
  using ( owner_id = auth.uid() );
  -- Or check role in users table

-- Items: Users can view items of their restaurant
create policy "View items of own restaurant"
  on public.items for select
  using ( 
    restaurant_id in (
      select restaurant_id from public.users where id = auth.uid()
    ) 
  );

-- Items: Admins can insert/update/delete items
create policy "Admins manage items"
  on public.items for all
  using ( 
    restaurant_id in (
      select restaurant_id from public.users where id = auth.uid() and role = 'admin'
    ) 
  );

-- Orders: Users can view orders of their restaurant
create policy "View orders of own restaurant"
  on public.orders for select
  using ( 
    restaurant_id in (
      select restaurant_id from public.users where id = auth.uid()
    ) 
  );

-- Orders: Staff and Admin can insert orders
create policy "Create orders"
  on public.orders for insert
  with check ( 
    restaurant_id in (
      select restaurant_id from public.users where id = auth.uid()
    ) 
  );

-- Order Items: View
create policy "View order items"
  on public.order_items for select
  using ( 
    order_id in (
        select id from public.orders where restaurant_id in (
            select restaurant_id from public.users where id = auth.uid()
        )
    )
  );

-- Order Items: Insert
create policy "Create order items"
  on public.order_items for insert
  with check ( 
    order_id in (
        select id from public.orders where restaurant_id in (
            select restaurant_id from public.users where id = auth.uid()
        )
    )
  );

-- STORAGE BUCKET setup (requires storage extension active)
insert into storage.buckets (id, name, public)
values ('bills', 'bills', true);

create policy "Public Access to Bills"
  on storage.objects for select
  using ( bucket_id = 'bills' );

create policy "Authenticated Users can upload bills"
  on storage.objects for insert
  with check ( bucket_id = 'bills' and auth.role() = 'authenticated' );

