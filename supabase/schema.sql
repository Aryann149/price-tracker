-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  alert_email text,
  created_at timestamp with time zone default now()
);

-- Products table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  url text not null,
  image_url text,
  target_price decimal(10,2),
  current_price decimal(10,2),
  lowest_price decimal(10,2),
  currency text default 'INR',
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Price history table
create table public.price_history (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  site text not null,
  price decimal(10,2) not null,
  url text,
  checked_at timestamp with time zone default now()
);

-- Alerts sent table
create table public.alerts_sent (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  alert_type text not null, -- 'price_drop' or 'target_reached'
  message text not null,
  sent_at timestamp with time zone default now()
);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.price_history enable row level security;
alter table public.alerts_sent enable row level security;

-- Policies: users can only see their own data
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can view own products" on public.products for select using (auth.uid() = user_id);
create policy "Users can insert own products" on public.products for insert with check (auth.uid() = user_id);
create policy "Users can update own products" on public.products for update using (auth.uid() = user_id);
create policy "Users can delete own products" on public.products for delete using (auth.uid() = user_id);

create policy "Users can view own price history" on public.price_history for select using (
  auth.uid() = (select user_id from public.products where id = product_id)
);

create policy "Users can view own alerts" on public.alerts_sent for select using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
