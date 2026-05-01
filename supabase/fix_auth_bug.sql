
-- 1. Fix Circular Dependency in Foreign Keys
-- We need to drop the constraint that requires a public.user to exist before a restaurant can be created
-- because we create them at the same time.
do $$
begin
  if exists (select 1 from information_schema.table_constraints where constraint_name = 'restaurants_owner_id_fkey') then
    alter table public.restaurants drop constraint restaurants_owner_id_fkey;
  end if;
  
  -- Add a safer constraint referencing auth.users directly (which definitely exists)
  alter table public.restaurants 
  add constraint restaurants_owner_id_fkey 
  foreign key (owner_id) references auth.users(id);
end $$;

-- 2. Update the Trigger Function to be fail-safe
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_rest_id uuid;
begin
  -- A. Insert into public.users FIRST (with null restaurant_id)
  -- This ensures the row exists if we needed it for other FKs
  insert into public.users (id, role)
  values (new.id, 'admin');

  -- B. Create the restaurant
  insert into public.restaurants (name, owner_id)
  values ('My Restaurant', new.id)
  returning id into new_rest_id;

  -- C. Update the user with the new restaurant_id
  update public.users 
  set restaurant_id = new_rest_id 
  where id = new.id;
  
  return new;
end;
$$ language plpgsql security definer;

-- 3. Ensure Trigger is active
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
