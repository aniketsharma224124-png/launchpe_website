import { createClient } from "@supabase/supabase-js";

export function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// SQL schema to run in Supabase SQL editor:
export const SCHEMA = `
create table if not exists profiles (
  id uuid references auth.users primary key,
  email text unique not null,
  name text,
  avatar text,
  plan text default 'free',
  posts_generated int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  url text not null,
  product_name text,
  data jsonb,
  shareable_id text unique,
  created_at timestamptz default now()
);

create table if not exists payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  razorpay_order_id text,
  razorpay_payment_id text,
  plan text,
  amount int,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table analyses enable row level security;
alter table payment_orders enable row level security;

create policy "Users own profile" on profiles for all using (auth.uid() = id);
create policy "Users own analyses" on analyses for all using (auth.uid() = user_id);
create policy "Public read analyses" on analyses for select using (true);
create policy "Users own orders" on payment_orders for all using (auth.uid() = user_id);
`;
