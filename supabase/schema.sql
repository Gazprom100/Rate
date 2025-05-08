-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create tokens table
create table if not exists tokens (
  id text primary key,
  symbol text not null,
  name text not null,
  price numeric not null,
  reserve numeric not null,
  crr numeric not null,
  wallets_count integer not null,
  delegation_percentage numeric not null,
  market_cap numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create token_history table
create table if not exists token_history (
  id uuid default uuid_generate_v4() primary key,
  token_id text references tokens(id) not null,
  price numeric not null,
  reserve numeric not null,
  crr numeric not null,
  wallets_count integer not null,
  delegation_percentage numeric not null,
  market_cap numeric not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index if not exists idx_token_history_token_id on token_history(token_id);
create index if not exists idx_token_history_timestamp on token_history(timestamp);
create index if not exists idx_tokens_market_cap on tokens(market_cap desc);
create index if not exists idx_tokens_price on tokens(price desc);
create index if not exists idx_tokens_reserve on tokens(reserve desc);
create index if not exists idx_tokens_crr on tokens(crr desc);
create index if not exists idx_tokens_wallets_count on tokens(wallets_count desc);
create index if not exists idx_tokens_delegation_percentage on tokens(delegation_percentage desc);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger for tokens table
create trigger update_tokens_updated_at
  before update on tokens
  for each row
  execute function update_updated_at_column();

-- Create RLS policies
alter table tokens enable row level security;
alter table token_history enable row level security;

-- Allow public read access to tokens
create policy "Allow public read access to tokens"
  on tokens for select
  to public
  using (true);

-- Allow public read access to token_history
create policy "Allow public read access to token_history"
  on token_history for select
  to public
  using (true);

-- Allow service role to insert/update tokens
create policy "Allow service role to insert/update tokens"
  on tokens for all
  to service_role
  using (true)
  with check (true);

-- Allow service role to insert token_history
create policy "Allow service role to insert token_history"
  on token_history for insert
  to service_role
  with check (true); 